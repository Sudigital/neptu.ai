import jwt from "jsonwebtoken";
import jwksRsa from "jwks-rsa";

export interface DynamicJwtPayload {
  sub: string;
  environment_id: string;
  verified_credentials: Array<{
    address?: string;
    chain?: string;
    format: string;
    id: string;
  }>;
}

function getEnvironmentId(): string {
  const envId = process.env.DYNAMIC_ENVIRONMENT_ID;
  if (!envId) {
    throw new Error(
      "DYNAMIC_ENVIRONMENT_ID env var is required for JWT verification"
    );
  }
  return envId;
}

let jwksClient: jwksRsa.JwksClient | null = null;

function getJwksClient(): jwksRsa.JwksClient {
  if (!jwksClient) {
    jwksClient = jwksRsa({
      jwksUri: `https://app.dynamic.xyz/api/v0/sdk/${getEnvironmentId()}/.well-known/jwks`,
      cache: true,
      cacheMaxAge: 600_000,
      rateLimit: true,
    });
  }
  return jwksClient;
}

function getSigningKey(header: jwt.JwtHeader): Promise<string> {
  return new Promise((resolve, reject) => {
    getJwksClient().getSigningKey(header.kid, (err, key) => {
      if (err || !key) {
        reject(err ?? new Error("No signing key found"));
        return;
      }
      resolve(key.getPublicKey());
    });
  });
}

/**
 * Verify a JWT issued by Dynamic Labs via their JWKS endpoint.
 * Returns the decoded payload with user ID and verified credentials.
 */
export async function verifyDynamicJwt(
  token: string
): Promise<DynamicJwtPayload> {
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || typeof decoded === "string") {
    throw new Error("Invalid JWT format");
  }

  const publicKey = await getSigningKey(decoded.header);

  const payload = jwt.verify(token, publicKey, {
    algorithms: ["RS256"],
  }) as DynamicJwtPayload;

  if (!payload.sub) {
    throw new Error("Missing sub claim in Dynamic JWT");
  }

  return payload;
}

/**
 * Extract the first Solana wallet address from Dynamic JWT verified_credentials.
 */
export function extractWalletAddress(
  payload: DynamicJwtPayload
): string | undefined {
  const solanaCredential = payload.verified_credentials?.find(
    (vc) => vc.chain === "solana" && vc.address
  );
  if (solanaCredential?.address) {
    return solanaCredential.address;
  }
  // Fallback: first credential with an address
  return payload.verified_credentials?.find((vc) => vc.address)?.address;
}
