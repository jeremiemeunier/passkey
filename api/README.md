# @passkey/api

Serverless API for passkey authentication built with Next.js.

## Features

- 🔐 Complete WebAuthn implementation
- 🚀 Serverless-ready (Vercel, Netlify, AWS Lambda, etc.)
- 🔌 Pluggable storage interface
- 📝 TypeScript support
- ⚡ Zero-config development mode

## Quick Start

### Installation

```bash
cd api
npm install
```

### Configuration

Copy the environment variables template:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your settings:

```env
RP_NAME="Your App Name"
RP_ID="yourdomain.com"
ORIGIN="https://yourdomain.com"
```

For local development:
```env
RP_NAME="Passkey Demo"
RP_ID="localhost"
ORIGIN="http://localhost:3000"
```

### Development

```bash
npm run dev
```

The API will be available at `http://localhost:3000/api/passkey`.

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### `POST /api/passkey/register/options`

Generate registration options for a new passkey.

**Request:**
```json
{
  "username": "user@example.com",
  "displayName": "User Name",
  "userId": "optional-user-id"
}
```

**Response:**
```json
{
  "challenge": "...",
  "rp": {
    "name": "Your App",
    "id": "yourdomain.com"
  },
  "user": {
    "id": "...",
    "name": "user@example.com",
    "displayName": "User Name"
  },
  "pubKeyCredParams": [...],
  "timeout": 60000,
  "authenticatorSelection": {...}
}
```

### `POST /api/passkey/register/verify`

Verify a registration response.

**Request:**
```json
{
  "username": "user@example.com",
  "credential": {
    "id": "...",
    "rawId": "...",
    "response": {...},
    "type": "public-key"
  }
}
```

**Response:**
```json
{
  "verified": true,
  "userId": "...",
  "credentialId": "..."
}
```

### `POST /api/passkey/authenticate/options`

Generate authentication options.

**Request:**
```json
{
  "username": "user@example.com"  // Optional for resident keys
}
```

**Response:**
```json
{
  "challenge": "...",
  "rpId": "yourdomain.com",
  "allowCredentials": [...],
  "timeout": 60000,
  "userVerification": "preferred"
}
```

### `POST /api/passkey/authenticate/verify`

Verify an authentication response.

**Request:**
```json
{
  "username": "user@example.com",  // Optional
  "credential": {
    "id": "...",
    "rawId": "...",
    "response": {...},
    "type": "public-key"
  }
}
```

**Response:**
```json
{
  "verified": true,
  "userId": "...",
  "username": "user@example.com"
}
```

## Storage

The API uses a pluggable storage interface. By default, it uses in-memory storage for development.

### Available Storage Implementations

1. **MemoryStorage** (default) - In-memory storage for development/testing
   - ⚠️ Data is lost when the server restarts
   - ⚠️ Not suitable for production

### Custom Storage Implementation

To use your own database:

```typescript
import { PasskeyStorage } from './src/lib/storage';
import { PasskeyService } from './src/lib/passkey-service';

class MyDatabaseStorage implements PasskeyStorage {
  async saveUser(user) {
    // Save to your database
  }
  
  async getUserByUsername(username) {
    // Retrieve from your database
  }
  
  // Implement other methods...
}

const passkeyService = new PasskeyService({
  rpName: 'Your App',
  rpID: 'yourdomain.com',
  origin: 'https://yourdomain.com',
  storage: new MyDatabaseStorage(),
});
```

### Storage Interface

```typescript
interface PasskeyStorage {
  saveUser(user: UserPasskey): Promise<void>;
  getUserByUsername(username: string): Promise<UserPasskey | null>;
  getUserByCredentialId(credentialId: string): Promise<UserPasskey | null>;
  addCredential(username: string, credential: PasskeyCredential): Promise<void>;
  updateCredentialCounter(credentialId: string, counter: number): Promise<void>;
  saveChallenge(challenge: Challenge): Promise<void>;
  getAndDeleteChallenge(username: string): Promise<Challenge | null>;
  cleanupExpiredChallenges(): Promise<void>;
}
```

## Deployment

### Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `vercel`
3. Set environment variables in Vercel dashboard

### Netlify

1. Install Netlify CLI: `npm i -g netlify-cli`
2. Deploy: `netlify deploy --prod`
3. Set environment variables in Netlify dashboard

### Other Platforms

This API works on any platform that supports Next.js:
- AWS Lambda (via Serverless Next.js)
- Google Cloud Functions
- Azure Functions
- Cloudflare Workers

## Security Considerations

1. **HTTPS Required**: WebAuthn requires HTTPS in production (localhost is exempt)
2. **RP ID**: Must match your domain
3. **Origin**: Must match your application's URL
4. **Storage**: Use a proper database in production, not MemoryStorage
5. **Session Management**: Implement proper session management after authentication

## License

MIT
