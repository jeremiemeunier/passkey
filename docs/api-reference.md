# API Reference

Complete reference for the Passkey API endpoints.

## Base URL

- Development: `http://localhost:3000/api/passkey`
- Production: `https://yourdomain.com/api/passkey`

## Authentication Flow

### Registration Flow

1. Client requests registration options from `POST /register/options`
2. Client creates credentials using WebAuthn API
3. Client sends credentials to `POST /register/verify`
4. Server verifies and stores the credential

### Authentication Flow

1. Client requests authentication options from `POST /authenticate/options`
2. Client signs challenge using WebAuthn API
3. Client sends response to `POST /authenticate/verify`
4. Server verifies the signature and returns user info

---

## Endpoints

### Registration Options

Generate options for registering a new passkey.

**Endpoint:** `POST /api/passkey/register/options`

**Request Body:**
```json
{
  "username": "user@example.com",
  "displayName": "John Doe",
  "userId": "optional-custom-user-id"
}
```

**Parameters:**
- `username` (required): Unique identifier for the user (usually email)
- `displayName` (required): Human-readable display name
- `userId` (optional): Custom user ID. If not provided, one will be generated

**Response:**
```json
{
  "challenge": "base64url-encoded-challenge",
  "rp": {
    "name": "Your Application Name",
    "id": "yourdomain.com"
  },
  "user": {
    "id": "base64url-encoded-user-id",
    "name": "user@example.com",
    "displayName": "John Doe"
  },
  "pubKeyCredParams": [
    { "alg": -7, "type": "public-key" },
    { "alg": -257, "type": "public-key" }
  ],
  "timeout": 60000,
  "excludeCredentials": [],
  "authenticatorSelection": {
    "residentKey": "preferred",
    "userVerification": "preferred"
  },
  "attestation": "none"
}
```

**Error Responses:**

- `400 Bad Request`: Missing required fields
- `500 Internal Server Error`: Server error

---

### Registration Verification

Verify a registration response from the client.

**Endpoint:** `POST /api/passkey/register/verify`

**Request Body:**
```json
{
  "username": "user@example.com",
  "credential": {
    "id": "credential-id",
    "rawId": "credential-raw-id",
    "response": {
      "clientDataJSON": "base64url-encoded-data",
      "attestationObject": "base64url-encoded-data",
      "transports": ["internal", "hybrid"]
    },
    "type": "public-key",
    "clientExtensionResults": {},
    "authenticatorAttachment": "platform"
  }
}
```

**Parameters:**
- `username` (required): The username from registration options
- `credential` (required): The credential object from `navigator.credentials.create()`

**Response:**
```json
{
  "verified": true,
  "userId": "user-id",
  "credentialId": "credential-id"
}
```

**Error Responses:**

- `400 Bad Request`: Missing required fields
- `500 Internal Server Error`: Verification failed or server error

---

### Authentication Options

Generate options for authenticating with a passkey.

**Endpoint:** `POST /api/passkey/authenticate/options`

**Request Body:**
```json
{
  "username": "user@example.com"
}
```

**Parameters:**
- `username` (optional): Username to authenticate. If not provided, allows authentication with any credential (requires resident keys)

**Response:**
```json
{
  "challenge": "base64url-encoded-challenge",
  "rpId": "yourdomain.com",
  "allowCredentials": [
    {
      "id": "credential-id",
      "type": "public-key",
      "transports": ["internal", "hybrid"]
    }
  ],
  "timeout": 60000,
  "userVerification": "preferred"
}
```

**Error Responses:**

- `500 Internal Server Error`: Server error

---

### Authentication Verification

Verify an authentication response from the client.

**Endpoint:** `POST /api/passkey/authenticate/verify`

**Request Body:**
```json
{
  "username": "user@example.com",
  "credential": {
    "id": "credential-id",
    "rawId": "credential-raw-id",
    "response": {
      "clientDataJSON": "base64url-encoded-data",
      "authenticatorData": "base64url-encoded-data",
      "signature": "base64url-encoded-signature",
      "userHandle": "base64url-encoded-user-handle"
    },
    "type": "public-key",
    "clientExtensionResults": {},
    "authenticatorAttachment": "platform"
  }
}
```

**Parameters:**
- `username` (optional): The username being authenticated
- `credential` (required): The credential object from `navigator.credentials.get()`

**Response:**
```json
{
  "verified": true,
  "userId": "user-id",
  "username": "user@example.com"
}
```

**Error Responses:**

- `400 Bad Request`: Missing credential
- `500 Internal Server Error`: Verification failed or server error

---

## Environment Variables

Required environment variables for the API:

| Variable | Description | Example |
|----------|-------------|---------|
| `RP_NAME` | Relying Party name shown to users | `"My App"` |
| `RP_ID` | Your domain (without protocol/port) | `"example.com"` or `"localhost"` |
| `ORIGIN` | Full origin URL of your app | `"https://example.com"` or `"http://localhost:3000"` |

---

## Error Handling

All endpoints return errors in the following format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200 OK`: Success
- `400 Bad Request`: Invalid request parameters
- `405 Method Not Allowed`: Wrong HTTP method
- `500 Internal Server Error`: Server-side error

---

## Security Considerations

1. **HTTPS Required**: WebAuthn requires HTTPS in production (localhost is exempt for development)

2. **RP ID Must Match Domain**: The `RP_ID` must match your domain name

3. **Origin Must Match**: The `ORIGIN` must exactly match your application's URL

4. **Challenge Expiration**: Challenges expire after 5 minutes for security

5. **Counter Protection**: The API tracks signature counters to prevent replay attacks

6. **Single-Use Challenges**: Each challenge can only be used once

---

## Rate Limiting

Consider implementing rate limiting in production:

- Registration: 5 requests per minute per IP
- Authentication: 10 requests per minute per IP

Example with Next.js middleware:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimiter = new Map<string, number[]>();

export function middleware(request: NextRequest) {
  const ip = request.ip || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  
  const requests = rateLimiter.get(ip) || [];
  const recentRequests = requests.filter(time => now - time < windowMs);
  
  if (recentRequests.length >= 10) {
    return new NextResponse('Too many requests', { status: 429 });
  }
  
  recentRequests.push(now);
  rateLimiter.set(ip, recentRequests);
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/passkey/:path*',
};
```

---

## CORS Configuration

If your frontend is on a different domain, configure CORS:

```typescript
// pages/api/passkey/[...slug].ts
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://yourfrontend.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Handle request...
}
```
