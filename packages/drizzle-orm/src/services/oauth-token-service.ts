import {
  OAUTH_ACCESS_TOKEN_TTL,
  OAUTH_AUTHORIZATION_CODE_TTL,
  OAUTH_JWT_ISSUER,
  OAUTH_REFRESH_TOKEN_TTL,
  OAUTH_TOKEN_TYPE,
  type OAuthScope,
} from "@neptu/shared";
import jwt from "jsonwebtoken";

import type { Database } from "../client";

import { OAuthAccessTokenRepository } from "../repositories/oauth-access-token-repository";
import { OAuthAuthorizationCodeRepository } from "../repositories/oauth-authorization-code-repository";
import { OAuthClientRepository } from "../repositories/oauth-client-repository";
import { OAuthRefreshTokenRepository } from "../repositories/oauth-refresh-token-repository";
import { OAuthClientService } from "./oauth-client-service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OAuthTokenPayload {
  /** Subject: user ID (null for client_credentials) */
  sub: string | null;
  /** Client ID */
  cid: string;
  /** Scopes */
  scope: string;
  /** Token type */
  typ: "oauth_access";
  /** JWT ID — used for revocation via token_hash */
  jti: string;
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export interface AuthorizationCodeResult {
  code: string;
  state: string;
  redirectUri: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getOAuthJwtSecret(): string {
  const secret = process.env.OAUTH_JWT_SECRET ?? process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("OAUTH_JWT_SECRET or JWT_SECRET env var is required");
  }
  return secret;
}

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function base64urlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function sha256Base64url(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return base64urlEncode(hashBuffer);
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class OAuthTokenService {
  private clientRepo: OAuthClientRepository;
  private codeRepo: OAuthAuthorizationCodeRepository;
  private accessTokenRepo: OAuthAccessTokenRepository;
  private refreshTokenRepo: OAuthRefreshTokenRepository;
  private clientService: OAuthClientService;

  constructor(db: Database) {
    this.clientRepo = new OAuthClientRepository(db);
    this.codeRepo = new OAuthAuthorizationCodeRepository(db);
    this.accessTokenRepo = new OAuthAccessTokenRepository(db);
    this.refreshTokenRepo = new OAuthRefreshTokenRepository(db);
    this.clientService = new OAuthClientService(db);
  }

  // -------------------------------------------------------------------------
  // Authorization Code
  // -------------------------------------------------------------------------

  async createAuthorizationCode(params: {
    clientId: string;
    userId: string;
    redirectUri: string;
    scopes: OAuthScope[];
    codeChallenge: string;
    codeChallengeMethod: "S256";
    state: string;
  }): Promise<AuthorizationCodeResult> {
    const client = await this.clientRepo.findActiveByClientId(params.clientId);
    if (!client) {
      throw new Error("Invalid client");
    }

    const uris = client.redirectUris as string[];
    if (!uris.includes(params.redirectUri)) {
      throw new Error("Invalid redirect URI");
    }

    const clientScopes = client.scopes as OAuthScope[];
    const invalidScopes = params.scopes.filter(
      (s) => !clientScopes.includes(s)
    );
    if (invalidScopes.length > 0) {
      throw new Error(`Invalid scopes: ${invalidScopes.join(", ")}`);
    }

    const code = this.generateRandomString(64);
    const codeHash = await sha256(code);
    const id = crypto.randomUUID();
    const expiresAt = new Date(
      Date.now() + OAUTH_AUTHORIZATION_CODE_TTL * 1000
    );

    await this.codeRepo.create({
      id,
      codeHash,
      clientId: client.id,
      userId: params.userId,
      redirectUri: params.redirectUri,
      scopes: params.scopes,
      codeChallenge: params.codeChallenge,
      codeChallengeMethod: params.codeChallengeMethod,
      expiresAt,
    });

    return {
      code,
      state: params.state,
      redirectUri: params.redirectUri,
    };
  }

  // -------------------------------------------------------------------------
  // Exchange Authorization Code → Tokens
  // -------------------------------------------------------------------------

  async exchangeAuthorizationCode(params: {
    code: string;
    redirectUri: string;
    clientId: string;
    clientSecret?: string;
    codeVerifier: string;
  }): Promise<OAuthTokenResponse> {
    const codeHash = await sha256(params.code);
    const authCode = await this.codeRepo.findValidByCodeHash(codeHash);

    if (!authCode) {
      throw new Error("Invalid or expired authorization code");
    }

    const client = await this.clientRepo.findById(authCode.clientId);
    if (!client || client.clientId !== params.clientId) {
      throw new Error("Client mismatch");
    }

    if (authCode.redirectUri !== params.redirectUri) {
      throw new Error("Redirect URI mismatch");
    }

    // Verify PKCE S256: BASE64URL(SHA256(code_verifier)) === code_challenge
    const computedChallenge = await sha256Base64url(params.codeVerifier);
    if (computedChallenge !== authCode.codeChallenge) {
      throw new Error("Invalid code verifier (PKCE validation failed)");
    }

    // If client is confidential, verify secret
    if (client.isConfidential) {
      if (!params.clientSecret) {
        throw new Error("Client secret required for confidential clients");
      }
      const valid = await this.clientService.verifySecret(
        params.clientSecret,
        client.clientSecretHash
      );
      if (!valid) {
        throw new Error("Invalid client secret");
      }
    }

    // Mark code as used (single-use)
    await this.codeRepo.markUsed(authCode.id);

    const scopes = authCode.scopes as OAuthScope[];
    return this.issueTokenPair(client.id, authCode.userId, scopes);
  }

  // -------------------------------------------------------------------------
  // Client Credentials Grant
  // -------------------------------------------------------------------------

  async clientCredentialsGrant(params: {
    clientId: string;
    clientSecret: string;
    scope?: string;
  }): Promise<OAuthTokenResponse> {
    const client = await this.clientRepo.findActiveByClientId(params.clientId);
    if (!client) {
      throw new Error("Invalid client");
    }

    const grantTypes = client.grantTypes as string[];
    if (!grantTypes.includes("client_credentials")) {
      throw new Error("Client is not authorized for client_credentials grant");
    }

    const valid = await this.clientService.verifySecret(
      params.clientSecret,
      client.clientSecretHash
    );
    if (!valid) {
      throw new Error("Invalid client credentials");
    }

    let scopes: OAuthScope[];
    if (params.scope) {
      const requested = params.scope.split(" ") as OAuthScope[];
      const clientScopes = client.scopes as OAuthScope[];
      const invalid = requested.filter((s) => !clientScopes.includes(s));
      if (invalid.length > 0) {
        throw new Error(`Invalid scopes: ${invalid.join(", ")}`);
      }
      scopes = requested;
    } else {
      scopes = client.scopes as OAuthScope[];
    }

    // Client credentials: no user, no refresh token
    return this.issueAccessTokenOnly(client.id, null, scopes);
  }

  // -------------------------------------------------------------------------
  // Refresh Token Grant
  // -------------------------------------------------------------------------

  async refreshTokenGrant(params: {
    refreshToken: string;
    clientId: string;
    clientSecret?: string;
    scope?: string;
  }): Promise<OAuthTokenResponse> {
    const tokenHash = await sha256(params.refreshToken);
    const storedRefresh =
      await this.refreshTokenRepo.findValidByTokenHash(tokenHash);

    if (!storedRefresh) {
      throw new Error("Invalid or expired refresh token");
    }

    const client = await this.clientRepo.findById(storedRefresh.clientId);
    if (!client || client.clientId !== params.clientId) {
      throw new Error("Client mismatch");
    }

    if (client.isConfidential && params.clientSecret) {
      const valid = await this.clientService.verifySecret(
        params.clientSecret,
        client.clientSecretHash
      );
      if (!valid) {
        throw new Error("Invalid client secret");
      }
    }

    // Revoke old tokens (rotation)
    await this.refreshTokenRepo.revoke(storedRefresh.id);
    await this.accessTokenRepo.revoke(storedRefresh.accessTokenId);

    // Determine scopes — can only downscope
    const oldAccess = await this.accessTokenRepo.findById(
      storedRefresh.accessTokenId
    );
    const originalScopes = (oldAccess?.scopes ?? []) as OAuthScope[];

    let scopes: OAuthScope[];
    if (params.scope) {
      const requested = params.scope.split(" ") as OAuthScope[];
      const invalid = requested.filter((s) => !originalScopes.includes(s));
      if (invalid.length > 0) {
        throw new Error(
          `Cannot upscope during refresh. Invalid: ${invalid.join(", ")}`
        );
      }
      scopes = requested;
    } else {
      scopes = originalScopes;
    }

    return this.issueTokenPair(client.id, storedRefresh.userId, scopes);
  }

  // -------------------------------------------------------------------------
  // Token Revocation (RFC 7009)
  // -------------------------------------------------------------------------

  async revokeToken(params: {
    token: string;
    tokenTypeHint?: "access_token" | "refresh_token";
    clientId: string;
    clientSecret?: string;
  }): Promise<void> {
    const tokenHash = await sha256(params.token);

    // Try as access token first (or based on hint)
    if (params.tokenTypeHint !== "refresh_token") {
      const accessToken = await this.accessTokenRepo.findByTokenHash(tokenHash);
      if (accessToken) {
        await this.accessTokenRepo.revoke(accessToken.id);
        // Also revoke associated refresh tokens
        await this.refreshTokenRepo.revokeByAccessTokenId(accessToken.id);
        return;
      }
    }

    // Try as refresh token
    const refreshToken = await this.refreshTokenRepo.findByTokenHash(tokenHash);
    if (refreshToken) {
      await this.refreshTokenRepo.revoke(refreshToken.id);
      await this.accessTokenRepo.revoke(refreshToken.accessTokenId);
      return;
    }

    // RFC 7009: respond 200 even if token not found (no error)
  }

  // -------------------------------------------------------------------------
  // Token Verification (for middleware)
  // -------------------------------------------------------------------------

  verifyAccessToken(token: string): OAuthTokenPayload {
    const secret = getOAuthJwtSecret();
    const payload = jwt.verify(token, secret, {
      issuer: OAUTH_JWT_ISSUER,
    }) as OAuthTokenPayload;

    if (payload.typ !== "oauth_access") {
      throw new Error("Invalid token type");
    }

    return payload;
  }

  async isTokenRevoked(jti: string): Promise<boolean> {
    const tokenHash = jti;
    const token = await this.accessTokenRepo.findValidByTokenHash(tokenHash);
    return !token;
  }

  // -------------------------------------------------------------------------
  // Private: Token Issuance
  // -------------------------------------------------------------------------

  private async issueTokenPair(
    clientDbId: string,
    userId: string | null,
    scopes: OAuthScope[]
  ): Promise<OAuthTokenResponse> {
    const secret = getOAuthJwtSecret();
    const accessTokenId = crypto.randomUUID();
    const refreshTokenRaw = this.generateRandomString(64);

    const now = new Date();
    const accessExpiresAt = new Date(
      now.getTime() + OAUTH_ACCESS_TOKEN_TTL * 1000
    );
    const refreshExpiresAt = new Date(
      now.getTime() + OAUTH_REFRESH_TOKEN_TTL * 1000
    );

    const scopeString = scopes.join(" ");
    const jti = await sha256(accessTokenId);

    // Sign JWT access token
    const accessToken = jwt.sign(
      {
        sub: userId,
        cid: clientDbId,
        scope: scopeString,
        typ: "oauth_access",
        jti,
      } satisfies OAuthTokenPayload,
      secret,
      {
        expiresIn: OAUTH_ACCESS_TOKEN_TTL,
        issuer: OAUTH_JWT_ISSUER,
      }
    );

    // Store access token record
    await this.accessTokenRepo.create({
      id: accessTokenId,
      tokenHash: jti,
      clientId: clientDbId,
      userId,
      scopes,
      expiresAt: accessExpiresAt,
    });

    // Store refresh token
    const refreshTokenHash = await sha256(refreshTokenRaw);
    const refreshTokenId = crypto.randomUUID();

    await this.refreshTokenRepo.create({
      id: refreshTokenId,
      tokenHash: refreshTokenHash,
      accessTokenId,
      clientId: clientDbId,
      userId,
      expiresAt: refreshExpiresAt,
    });

    return {
      access_token: accessToken,
      token_type: OAUTH_TOKEN_TYPE,
      expires_in: OAUTH_ACCESS_TOKEN_TTL,
      refresh_token: refreshTokenRaw,
      scope: scopeString,
    };
  }

  private async issueAccessTokenOnly(
    clientDbId: string,
    userId: string | null,
    scopes: OAuthScope[]
  ): Promise<OAuthTokenResponse> {
    const secret = getOAuthJwtSecret();
    const accessTokenId = crypto.randomUUID();

    const now = new Date();
    const accessExpiresAt = new Date(
      now.getTime() + OAUTH_ACCESS_TOKEN_TTL * 1000
    );

    const scopeString = scopes.join(" ");
    const jti = await sha256(accessTokenId);

    const accessToken = jwt.sign(
      {
        sub: userId,
        cid: clientDbId,
        scope: scopeString,
        typ: "oauth_access",
        jti,
      } satisfies OAuthTokenPayload,
      secret,
      {
        expiresIn: OAUTH_ACCESS_TOKEN_TTL,
        issuer: OAUTH_JWT_ISSUER,
      }
    );

    await this.accessTokenRepo.create({
      id: accessTokenId,
      tokenHash: jti,
      clientId: clientDbId,
      userId,
      scopes,
      expiresAt: accessExpiresAt,
    });

    return {
      access_token: accessToken,
      token_type: OAUTH_TOKEN_TYPE,
      expires_in: OAUTH_ACCESS_TOKEN_TTL,
      scope: scopeString,
    };
  }

  private generateRandomString(length: number): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }
    return result;
  }
}
