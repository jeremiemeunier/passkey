# Implementation Guide: Using the Passkey API

This guide shows how to implement passkey authentication using the included API server.

## Overview

This approach uses:
- **@passkey/client** package for the frontend
- **@passkey/api** for the backend (included in this repository)

Perfect for projects that need a quick, serverless-ready authentication solution.

---

## Prerequisites

- Node.js 18+ installed
- A modern browser with WebAuthn support
- HTTPS domain (for production) or localhost (for development)

---

## Step 1: Set Up the API

### Install Dependencies

```bash
cd api
npm install
```

### Configure Environment Variables

Create `.env.local`:

```env
RP_NAME="My App"
RP_ID="localhost"
ORIGIN="http://localhost:3000"
```

For production:
```env
RP_NAME="My App"
RP_ID="myapp.com"
ORIGIN="https://myapp.com"
```

### Start the API Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000/api/passkey`.

---

## Step 2: Set Up Your Frontend

### Install the Client Package

```bash
npm install @passkey/client
```

### React Example

Create a login component:

```tsx
// components/PasskeyAuth.tsx
import { usePasskey } from '@passkey/client';
import { useState } from 'react';

export function PasskeyAuth() {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const { register, authenticate, isLoading, error, isSupported } = usePasskey({
    apiUrl: '/api/passkey', // Your API endpoint
  });

  const handleRegister = async () => {
    if (!username || !displayName) {
      alert('Please enter username and display name');
      return;
    }

    const result = await register(username, displayName);
    
    if (result.success) {
      alert('Registration successful!');
      console.log('User registered:', result.data);
      // Redirect or update UI
    } else {
      alert(`Registration failed: ${result.error}`);
    }
  };

  const handleLogin = async () => {
    if (!username) {
      alert('Please enter username');
      return;
    }

    const result = await authenticate(username);
    
    if (result.success) {
      alert('Login successful!');
      console.log('User authenticated:', result.data);
      // Set session, redirect, etc.
    } else {
      alert(`Login failed: ${result.error}`);
    }
  };

  if (!isSupported) {
    return (
      <div>
        <h2>Passkeys Not Supported</h2>
        <p>Your browser doesn't support passkeys. Please use a modern browser.</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Passkey Authentication</h2>
      
      <div>
        <input
          type="email"
          placeholder="Email"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div>
        <input
          type="text"
          placeholder="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div>
        <button onClick={handleRegister} disabled={isLoading}>
          Register with Passkey
        </button>
        <button onClick={handleLogin} disabled={isLoading}>
          Login with Passkey
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {isLoading && <p>Processing...</p>}
    </div>
  );
}
```

### Vanilla JavaScript Example

```javascript
// auth.js
import { PasskeyClient } from '@passkey/client';

const client = new PasskeyClient({
  apiUrl: '/api/passkey',
});

// Registration
async function registerUser(username, displayName) {
  const result = await client.register(username, displayName);
  
  if (result.success) {
    console.log('Registration successful:', result.data);
    // Handle success
  } else {
    console.error('Registration failed:', result.error);
    // Handle error
  }
}

// Authentication
async function loginUser(username) {
  const result = await client.authenticate(username);
  
  if (result.success) {
    console.log('Login successful:', result.data);
    // Set session, redirect, etc.
  } else {
    console.error('Login failed:', result.error);
    // Handle error
  }
}

// Usage
document.getElementById('registerBtn').addEventListener('click', () => {
  const username = document.getElementById('username').value;
  const displayName = document.getElementById('displayName').value;
  registerUser(username, displayName);
});

document.getElementById('loginBtn').addEventListener('click', () => {
  const username = document.getElementById('username').value;
  loginUser(username);
});
```

---

## Step 3: Session Management

After successful authentication, create a session:

```typescript
// pages/api/auth/session.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, username } = req.body;

  // In production, use a proper session library (e.g., iron-session, next-auth)
  const sessionToken = generateSecureToken(); // Implement secure token generation
  
  // Store session in database
  await storeSession(sessionToken, { userId, username });

  // Set HTTP-only cookie
  res.setHeader(
    'Set-Cookie',
    serialize('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    })
  );

  return res.status(200).json({ success: true });
}
```

Update your login flow:

```typescript
const result = await authenticate(username);

if (result.success) {
  // Create session
  await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result.data),
  });
  
  // Redirect to dashboard
  window.location.href = '/dashboard';
}
```

---

## Step 4: Deploy to Production

### Vercel Deployment

1. Push your code to GitHub
2. Import project in Vercel
3. Set environment variables:
   - `RP_NAME`: Your app name
   - `RP_ID`: Your domain (e.g., `myapp.com`)
   - `ORIGIN`: Your full URL (e.g., `https://myapp.com`)
4. Deploy

### Netlify Deployment

1. Connect your repository
2. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
3. Set environment variables
4. Deploy

---

## Step 5: Custom Storage (Production)

Replace the in-memory storage with a database:

```typescript
// api/src/lib/database-storage.ts
import { PasskeyStorage, UserPasskey, PasskeyCredential, Challenge } from './storage';
import { prisma } from './prisma'; // or your database client

export class DatabaseStorage implements PasskeyStorage {
  async saveUser(user: UserPasskey): Promise<void> {
    await prisma.user.create({
      data: {
        userId: user.userId,
        username: user.username,
        displayName: user.displayName,
        credentials: {
          create: user.credentials.map(cred => ({
            id: cred.id,
            publicKey: cred.publicKey,
            counter: cred.counter,
            transports: cred.transports,
          })),
        },
      },
    });
  }

  async getUserByUsername(username: string): Promise<UserPasskey | null> {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { credentials: true },
    });
    
    return user ? {
      userId: user.userId,
      username: user.username,
      displayName: user.displayName,
      credentials: user.credentials.map(c => ({
        id: c.id,
        publicKey: c.publicKey,
        counter: c.counter,
        transports: c.transports,
        createdAt: c.createdAt,
      })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    } : null;
  }

  // Implement other methods...
}
```

Update your API endpoints:

```typescript
// pages/api/passkey/register/options.ts
import { DatabaseStorage } from '@/lib/database-storage';

const passkeyService = new PasskeyService({
  rpName: process.env.RP_NAME || 'Passkey Demo',
  rpID: process.env.RP_ID || 'localhost',
  origin: process.env.ORIGIN || 'http://localhost:3000',
  storage: new DatabaseStorage(), // Use database storage
});
```

---

## Testing

### Test Registration

1. Open your app in a browser
2. Enter email and name
3. Click "Register with Passkey"
4. Complete the browser prompt
5. Verify success message

### Test Authentication

1. Enter the same email
2. Click "Login with Passkey"
3. Complete the browser prompt
4. Verify you're logged in

---

## Troubleshooting

### "Passkeys not supported"
- Use a modern browser (Chrome 67+, Safari 13+, Firefox 60+)
- Ensure you're on HTTPS (or localhost for development)

### "Challenge not found"
- Challenges expire after 5 minutes
- Make sure the API server is running
- Check that clocks are synchronized

### "Registration failed"
- Verify RP_ID matches your domain
- Verify ORIGIN matches your URL exactly
- Check browser console for errors

### "User already exists"
- Each passkey is tied to a credential, you can register multiple passkeys per user

---

## Next Steps

- Implement multi-factor authentication
- Add passkey management UI (list, rename, delete)
- Implement account recovery flows
- Add biometric authentication options
- Monitor authentication metrics

---

## Security Checklist

- ✅ Use HTTPS in production
- ✅ Set correct RP_ID and Origin
- ✅ Use HTTP-only cookies for sessions
- ✅ Implement rate limiting
- ✅ Use a proper database (not in-memory storage)
- ✅ Enable CORS only for your domain
- ✅ Implement session timeout
- ✅ Log authentication attempts
- ✅ Monitor for suspicious activity

---

## Resources

- [API Reference](./api-reference.md)
- [Package Documentation](../package/README.md)
- [WebAuthn Specification](https://www.w3.org/TR/webauthn/)
- [Passkeys.dev](https://passkeys.dev/)
