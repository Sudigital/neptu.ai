import type { Context, Next } from "hono";

import { createRemoteJWKSet, jwtVerify } from "jose";

interface DynamicJwtPayload {
  sub: string;
  environment_id: string;
  verified_credentials?: Array<{
    address: string;
    chain: string;
    id: string;
    wallet_name?: string;
  }>;
  verified_account?: {
    address: string;
    chain: string;
    id: string;
    wallet_name?: string;
  };
  email?: string;
  alias?: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
}

interface DynamicAuthEnv {
  Variables: {
    dynamicUserId: string;
    walletAddress: string;
    dynamicEmail: string | undefined;
    dynamicPayload: DynamicJwtPayload;
  };
}

const DYNAMIC_ENVIRONMENT_ID = process.env.VITE_DYNAMIC_ENVIRONMENT_ID || "";

if (!DYNAMIC_ENVIRONMENT_ID) {
  throw new Error(
    "VITE_DYNAMIC_ENVIRONMENT_ID is required for JWT verification"
  );
}

const JWKS_URL = `https://app.dynamic.xyz/api/v0/sdk/${DYNAMIC_ENVIRONMENT_ID}/.well-known/jwks`;
const EXPECTED_ISSUER = `app.dynamic.xyz/${DYNAMIC_ENVIRONMENT_ID}`;

const jwks = createRemoteJWKSet(new URL(JWKS_URL));

function extractWalletAddress(payload: DynamicJwtPayload): string | undefined {
  if (payload.verified_account?.address) {
    return payload.verified_account.address;
  }

  const solanaWallet = payload.verified_credentials?.find(
    (c) => c.chain === "solana" || c.chain === "sol"
  );
  if (solanaWallet?.address) {
    return solanaWallet.address;
  }

  const evmWallet = payload.verified_credentials?.find(
    (c) => c.chain === "eip155" || c.chain === "evm"
  );
  if (evmWallet?.address) {
    return evmWallet.address;
  }

  return payload.verified_credentials?.[0]?.address;
}

export async function dynamicAuth(
  c: Context<DynamicAuthEnv>,
  next: Next
): Promise<Response | void> {
  const authHeader = c.req.header("Authorization");
  if (!authHeader) {
    return c.json({ error: "Authorization header required" }, 401);
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return c.json(
      { error: "Invalid authorization format. Use: Bearer <token>" },
      401
    );
  }

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: EXPECTED_ISSUER,
    });

    const dynamicPayload = payload as unknown as DynamicJwtPayload;

    if (dynamicPayload.environment_id !== DYNAMIC_ENVIRONMENT_ID) {
      return c.json({ error: "Invalid environment" }, 403);
    }

    const walletAddress = extractWalletAddress(dynamicPayload);
    if (!walletAddress) {
      return c.json({ error: "No verified wallet found in token" }, 403);
    }

    c.set("dynamicUserId", dynamicPayload.sub);
    c.set("walletAddress", walletAddress);
    c.set("dynamicEmail", dynamicPayload.email);
    c.set("dynamicPayload", dynamicPayload);

    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
}
