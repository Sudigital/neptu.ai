# OAuth 2.0 API

Neptu provides a full OAuth 2.0 provider that allows third-party applications to access the Neptu Wariga Calculator API on behalf of users.

## Overview

| Feature                       | Details                      |
| ----------------------------- | ---------------------------- |
| **Authorization Code + PKCE** | For web and mobile apps      |
| **Client Credentials**        | For server-to-server (M2M)   |
| **Refresh Token**             | Rotate expired access tokens |
| **Scopes**                    | `neptu:read`, `neptu:ai`     |
| **Token Format**              | JWT (HS256)                  |
| **Access Token TTL**          | 1 hour                       |
| **Refresh Token TTL**         | 30 days                      |

## Discovery

```
GET /.well-known/oauth-authorization-server
```

Returns RFC 8414 server metadata including all supported endpoints, grant types, and scopes.

## Scopes

| Scope        | Description                                                         |
| ------------ | ------------------------------------------------------------------- |
| `neptu:read` | Read basic Wariga calculator data (Potensi, Peluang, Compatibility) |
| `neptu:ai`   | Access AI-enhanced readings (Oracle, Interpretation, Chat)          |

## Authentication Flows

### Authorization Code + PKCE

Best for web and mobile applications where a user grants consent.

#### Step 1: Generate PKCE Pair

```js
// Generate code_verifier (43-128 chars, URL-safe)
const codeVerifier = generateRandomString(64);

// Generate code_challenge = BASE64URL(SHA256(code_verifier))
const digest = await crypto.subtle.digest(
  "SHA-256",
  new TextEncoder().encode(codeVerifier)
);
const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
  .replace(/\+/g, "-")
  .replace(/\//g, "_")
  .replace(/=/g, "");
```

#### Step 2: Redirect User to Authorization

```
GET /api/oauth/authorize
  ?response_type=code
  &client_id=nptu_client_abc123
  &redirect_uri=https://example.com/callback
  &scope=neptu:read neptu:ai
  &state=random_state_string
  &code_challenge=BASE64URL_SHA256_OF_VERIFIER
  &code_challenge_method=S256
```

The user sees a consent screen and approves/denies access.

#### Step 3: Exchange Code for Tokens

```
POST /api/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=AUTHORIZATION_CODE
&redirect_uri=https://example.com/callback
&client_id=nptu_client_abc123
&code_verifier=ORIGINAL_CODE_VERIFIER
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "dGhpcyBpcyBhIHJlZn...",
  "scope": "neptu:read neptu:ai"
}
```

### Client Credentials

For server-to-server access without a user context.

```
POST /api/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=nptu_client_abc123
&client_secret=YOUR_CLIENT_SECRET
&scope=neptu:read
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "neptu:read"
}
```

::: warning
Client Credentials grants do not include a `refresh_token` since there is no user context.
:::

### Refresh Token

Exchange a refresh token for a new token pair (with rotation).

```
POST /api/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=dGhpcyBpcyBhIHJlZn...
&client_id=nptu_client_abc123
```

The old refresh token is revoked and a new pair is issued (token rotation).

## Using Access Tokens

Include the access token in the `Authorization` header:

```
GET /api/your-endpoint
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## User Info

```
GET /api/oauth/userinfo
Authorization: Bearer ACCESS_TOKEN
```

Returns information about the authenticated user based on granted scopes:

```json
{
  "sub": "user-uuid",
  "wallet_address": "ABC123...",
  "display_name": "John"
}
```

## Token Revocation

Revoke access or refresh tokens per RFC 7009:

```
POST /api/oauth/revoke
Content-Type: application/x-www-form-urlencoded

token=ACCESS_OR_REFRESH_TOKEN
&client_id=nptu_client_abc123
&token_type_hint=access_token
```

Always returns `200 OK` regardless of whether the token existed.

## Rate Limits

| Endpoint              | Limit       | Window     |
| --------------------- | ----------- | ---------- |
| `POST /token`         | 20 requests | 60 seconds |
| `GET/POST /authorize` | 30 requests | 60 seconds |
| `POST /revoke`        | 30 requests | 60 seconds |
| `GET /userinfo`       | 60 requests | 60 seconds |

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 19
X-RateLimit-Reset: 1708300800
```

## Error Responses

OAuth errors follow RFC 6749 format:

```json
{
  "error": "invalid_grant",
  "error_description": "Invalid or expired authorization code"
}
```

| Error Code            | Description                   |
| --------------------- | ----------------------------- |
| `invalid_client`      | Client not found or inactive  |
| `invalid_grant`       | Code/token expired or invalid |
| `invalid_scope`       | Requested scope not allowed   |
| `invalid_request`     | Missing required parameters   |
| `access_denied`       | User denied authorization     |
| `rate_limit_exceeded` | Too many requests             |

## Client Management

Developers manage OAuth clients via the Developer Portal or API:

| Method   | Endpoint                                         | Description        |
| -------- | ------------------------------------------------ | ------------------ |
| `GET`    | `/api/developer/oauth/clients`                   | List your clients  |
| `POST`   | `/api/developer/oauth/clients`                   | Create a client    |
| `GET`    | `/api/developer/oauth/clients/:id`               | Get client details |
| `PATCH`  | `/api/developer/oauth/clients/:id`               | Update a client    |
| `POST`   | `/api/developer/oauth/clients/:id/rotate-secret` | Rotate secret      |
| `DELETE` | `/api/developer/oauth/clients/:id`               | Delete a client    |

::: tip
Client management endpoints require PASETO authentication (Developer role or above).
:::

### Create Client

```
POST /api/developer/oauth/clients
Authorization: Bearer PASETO_TOKEN
Content-Type: application/json

{
  "name": "My App",
  "description": "A cool Neptu integration",
  "redirectUris": ["https://example.com/callback"],
  "scopes": ["neptu:read", "neptu:ai"],
  "grantTypes": ["authorization_code", "refresh_token"],
  "isConfidential": true
}
```

**Response:**

```json
{
  "success": true,
  "client": {
    "id": "uuid",
    "clientId": "nptu_client_abc123def456",
    "clientSecret": "STORE_THIS_SECURELY",
    "name": "My App",
    "scopes": ["neptu:read", "neptu:ai"],
    "grantTypes": ["authorization_code", "refresh_token"],
    "redirectUris": ["https://example.com/callback"],
    "isConfidential": true,
    "isActive": true,
    "createdAt": "2026-02-19T00:00:00.000Z"
  },
  "warning": "Store the clientSecret securely. It will not be shown again."
}
```

## JWT Token Structure

Access tokens are JWTs with the following payload:

```json
{
  "sub": "user-id-or-null",
  "cid": "client-db-id",
  "scope": "neptu:read neptu:ai",
  "typ": "oauth_access",
  "jti": "token-hash-for-revocation",
  "iss": "https://api.neptu.sudigital.com",
  "iat": 1708300000,
  "exp": 1708303600
}
```

| Field   | Description                           |
| ------- | ------------------------------------- |
| `sub`   | User ID (null for client_credentials) |
| `cid`   | Internal client database ID           |
| `scope` | Space-separated granted scopes        |
| `typ`   | Always `oauth_access`                 |
| `jti`   | Token ID for revocation tracking      |
| `iss`   | Token issuer URL                      |

## Webhooks

Register webhooks to receive real-time notifications about OAuth events for your application.

### Events

| Event                   | Description                  |
| ----------------------- | ---------------------------- |
| `token.created`         | New access token issued      |
| `token.revoked`         | Token was revoked            |
| `client.updated`        | Client settings were updated |
| `client.deleted`        | Client was deleted           |
| `authorization.granted` | User approved authorization  |
| `authorization.denied`  | User denied authorization    |

### Register a Webhook

```
POST /api/developer/oauth/clients/:clientId/webhooks
Authorization: Bearer <PASETO token>
Content-Type: application/json

{
  "url": "https://your-app.com/webhook",
  "events": ["token.created", "token.revoked", "authorization.granted"]
}
```

**Response:**

```json
{
  "success": true,
  "webhook": {
    "id": "...",
    "clientId": "...",
    "url": "https://your-app.com/webhook",
    "events": ["token.created", "token.revoked", "authorization.granted"],
    "isActive": true,
    "secret": "whsec_..."
  }
}
```

::: warning
The `secret` is only returned once at creation time. Store it securely.
:::

### Webhook Payload

When an event occurs, Neptu sends an HTTP POST to your registered URL:

```json
{
  "event": "token.created",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "client_id": "your-client-id",
    "grant_type": "authorization_code",
    "scope": "neptu:read"
  }
}
```

### Signature Verification

Every webhook includes an HMAC-SHA256 signature in the `X-Neptu-Signature` header:

```
X-Neptu-Signature: sha256=<hex-encoded-hmac>
X-Neptu-Event: token.created
X-Neptu-Delivery: <delivery-id>
```

Verify the signature using your webhook secret:

```typescript
import { createHmac } from "crypto";

function verifyWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected =
    "sha256=" + createHmac("sha256", secret).update(payload).digest("hex");
  return expected === signature;
}
```

### Retry Policy

| Attempt   | Delay      |
| --------- | ---------- |
| 1st retry | ~1 minute  |
| 2nd retry | ~4 minutes |
| 3rd retry | ~9 minutes |

Failed deliveries are retried with exponential backoff. After 3 failed attempts, the delivery is marked as `failed`.

### Manage Webhooks

| Method   | Endpoint                                     | Description        |
| -------- | -------------------------------------------- | ------------------ |
| `GET`    | `/clients/:clientId/webhooks`                | List all webhooks  |
| `POST`   | `/clients/:clientId/webhooks`                | Register a webhook |
| `PATCH`  | `/clients/:clientId/webhooks/:id`            | Update webhook     |
| `DELETE` | `/clients/:clientId/webhooks/:id`            | Delete webhook     |
| `GET`    | `/clients/:clientId/webhooks/:id/deliveries` | List deliveries    |

### Limits

- Maximum **5 webhooks** per OAuth client
- Delivery timeout: **10 seconds**
- Old deliveries are cleaned up after **30 days**
