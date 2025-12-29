# Implementation Guide: Using Your Own API

This guide shows how to implement passkey authentication with your own backend API.

## Overview

This approach uses:
- **@passkey/client** package for the frontend
- **Your own backend** (Express, FastAPI, Laravel, etc.)

Perfect for projects that already have a backend or need custom business logic.

---

## Prerequisites

- Node.js 18+ (for frontend)
- Your backend framework of choice
- A modern browser with WebAuthn support
- HTTPS domain (for production) or localhost (for development)

---

## Step 1: Install the Client Package

```bash
npm install @passkey/client
```

---

## Step 2: Understand the Protocol

The passkey flow requires 4 API endpoints:

1. **POST /register/options** - Generate registration challenge
2. **POST /register/verify** - Verify registration response
3. **POST /authenticate/options** - Generate authentication challenge
4. **POST /authenticate/verify** - Verify authentication response

---

## Step 3: Implement Backend Endpoints

### Node.js/Express Example

Install dependencies:

```bash
npm install @simplewebauthn/server express
```

Create your server:

```javascript
// server.js
import express from 'express';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';

const app = express();
app.use(express.json());

// Configuration
const RP_NAME = 'My App';
const RP_ID = 'localhost'; // Your domain
const ORIGIN = 'http://localhost:3000';

// In-memory storage (use a database in production!)
const users = new Map();
const challenges = new Map();

// Registration Options
app.post('/api/passkey/register/options', async (req, res) => {
  const { username, displayName, userId } = req.body;
  
  const userIdToUse = userId || generateRandomUserId();
  
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: userIdToUse,
    userName: username,
    userDisplayName: displayName,
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });
  
  // Store challenge
  challenges.set(username, {
    challenge: options.challenge,
    userId: userIdToUse,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  });
  
  res.json(options);
});

// Registration Verification
app.post('/api/passkey/register/verify', async (req, res) => {
  const { username, credential } = req.body;
  
  const challengeData = challenges.get(username);
  if (!challengeData || challengeData.expiresAt < Date.now()) {
    return res.status(400).json({ error: 'Challenge not found or expired' });
  }
  challenges.delete(username);
  
  try {
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challengeData.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    });
    
    if (!verification.verified || !verification.registrationInfo) {
      return res.status(400).json({ error: 'Verification failed' });
    }
    
    const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;
    
    // Save user and credential
    const user = users.get(username) || {
      userId: challengeData.userId,
      username,
      displayName: username,
      credentials: [],
    };
    
    user.credentials.push({
      id: Buffer.from(credentialID).toString('base64url'),
      publicKey: Buffer.from(credentialPublicKey).toString('base64url'),
      counter,
      transports: credential.response.transports,
    });
    
    users.set(username, user);
    
    res.json({
      verified: true,
      userId: user.userId,
      credentialId: Buffer.from(credentialID).toString('base64url'),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Authentication Options
app.post('/api/passkey/authenticate/options', async (req, res) => {
  const { username } = req.body;
  
  let allowCredentials = [];
  if (username) {
    const user = users.get(username);
    if (user) {
      allowCredentials = user.credentials.map(cred => ({
        id: Buffer.from(cred.id, 'base64url'),
        type: 'public-key',
        transports: cred.transports,
      }));
    }
  }
  
  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    allowCredentials,
    userVerification: 'preferred',
  });
  
  // Store challenge
  challenges.set(username || '__no_username__', {
    challenge: options.challenge,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });
  
  res.json(options);
});

// Authentication Verification
app.post('/api/passkey/authenticate/verify', async (req, res) => {
  const { username, credential } = req.body;
  
  const challengeData = challenges.get(username || '__no_username__');
  if (!challengeData || challengeData.expiresAt < Date.now()) {
    return res.status(400).json({ error: 'Challenge not found or expired' });
  }
  challenges.delete(username || '__no_username__');
  
  try {
    // Find user by credential ID
    let user = null;
    for (const [key, value] of users.entries()) {
      if (value.credentials.some(c => c.id === credential.id)) {
        user = value;
        break;
      }
    }
    
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    
    const dbCredential = user.credentials.find(c => c.id === credential.id);
    
    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challengeData.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      authenticator: {
        credentialID: Buffer.from(dbCredential.id, 'base64url'),
        credentialPublicKey: Buffer.from(dbCredential.publicKey, 'base64url'),
        counter: dbCredential.counter,
      },
    });
    
    if (!verification.verified) {
      return res.status(400).json({ error: 'Verification failed' });
    }
    
    // Update counter
    dbCredential.counter = verification.authenticationInfo.newCounter;
    users.set(user.username, user);
    
    res.json({
      verified: true,
      userId: user.userId,
      username: user.username,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});

function generateRandomUserId() {
  // Use Node.js crypto module
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('base64url');
}
```

### Python/FastAPI Example

Install dependencies:

```bash
pip install fastapi uvicorn webauthn
```

Create your server:

```python
# main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from webauthn import (
    generate_registration_options,
    verify_registration_response,
    generate_authentication_options,
    verify_authentication_response,
    options_to_json,
)
from webauthn.helpers.structs import (
    PublicKeyCredentialDescriptor,
    UserVerificationRequirement,
)
import time
from typing import Optional, List
import secrets

app = FastAPI()

# Configuration
RP_NAME = "My App"
RP_ID = "localhost"
ORIGIN = "http://localhost:3000"

# In-memory storage
users = {}
challenges = {}

class RegistrationOptionsRequest(BaseModel):
    username: str
    displayName: str
    userId: Optional[str] = None

class RegistrationVerifyRequest(BaseModel):
    username: str
    credential: dict

class AuthenticationOptionsRequest(BaseModel):
    username: Optional[str] = None

class AuthenticationVerifyRequest(BaseModel):
    username: Optional[str] = None
    credential: dict

@app.post("/api/passkey/register/options")
async def registration_options(req: RegistrationOptionsRequest):
    user_id = req.userId or secrets.token_urlsafe(32)
    
    options = generate_registration_options(
        rp_id=RP_ID,
        rp_name=RP_NAME,
        user_id=user_id,
        user_name=req.username,
        user_display_name=req.displayName,
    )
    
    challenges[req.username] = {
        "challenge": options.challenge,
        "userId": user_id,
        "expiresAt": time.time() + 5 * 60,
    }
    
    return options_to_json(options)

@app.post("/api/passkey/register/verify")
async def registration_verify(req: RegistrationVerifyRequest):
    challenge_data = challenges.get(req.username)
    if not challenge_data or challenge_data["expiresAt"] < time.time():
        raise HTTPException(400, "Challenge not found or expired")
    
    del challenges[req.username]
    
    try:
        verification = verify_registration_response(
            credential=req.credential,
            expected_challenge=challenge_data["challenge"],
            expected_origin=ORIGIN,
            expected_rp_id=RP_ID,
        )
        
        if req.username not in users:
            users[req.username] = {
                "userId": challenge_data["userId"],
                "username": req.username,
                "displayName": req.username,
                "credentials": [],
            }
        
        users[req.username]["credentials"].append({
            "id": verification.credential_id,
            "publicKey": verification.credential_public_key,
            "counter": verification.sign_count,
        })
        
        return {
            "verified": True,
            "userId": users[req.username]["userId"],
        }
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/api/passkey/authenticate/options")
async def authentication_options(req: AuthenticationOptionsRequest):
    allow_credentials = []
    if req.username and req.username in users:
        for cred in users[req.username]["credentials"]:
            allow_credentials.append(
                PublicKeyCredentialDescriptor(id=cred["id"])
            )
    
    options = generate_authentication_options(
        rp_id=RP_ID,
        allow_credentials=allow_credentials,
        user_verification=UserVerificationRequirement.PREFERRED,
    )
    
    challenges[req.username or "__no_username__"] = {
        "challenge": options.challenge,
        "expiresAt": time.time() + 5 * 60,
    }
    
    return options_to_json(options)

@app.post("/api/passkey/authenticate/verify")
async def authentication_verify(req: AuthenticationVerifyRequest):
    challenge_data = challenges.get(req.username or "__no_username__")
    if not challenge_data or challenge_data["expiresAt"] < time.time():
        raise HTTPException(400, "Challenge not found or expired")
    
    del challenges[req.username or "__no_username__"]
    
    # Find user by credential
    user = None
    for u in users.values():
        for cred in u["credentials"]:
            if cred["id"] == req.credential["id"]:
                user = u
                db_credential = cred
                break
    
    if not user:
        raise HTTPException(400, "User not found")
    
    try:
        verification = verify_authentication_response(
            credential=req.credential,
            expected_challenge=challenge_data["challenge"],
            expected_origin=ORIGIN,
            expected_rp_id=RP_ID,
            credential_public_key=db_credential["publicKey"],
            credential_current_sign_count=db_credential["counter"],
        )
        
        db_credential["counter"] = verification.new_sign_count
        
        return {
            "verified": True,
            "userId": user["userId"],
            "username": user["username"],
        }
    except Exception as e:
        raise HTTPException(500, str(e))
```

---

## Step 4: Configure the Client

Use the client package with your API URL:

```typescript
import { usePasskey } from '@passkey/client';

function MyComponent() {
  const { register, authenticate } = usePasskey({
    apiUrl: 'http://localhost:3001/api/passkey', // Your API URL
  });
  
  // Use register and authenticate as normal
}
```

Or with vanilla JavaScript:

```javascript
import { PasskeyClient } from '@passkey/client';

const client = new PasskeyClient({
  apiUrl: 'http://localhost:3001/api/passkey',
});
```

---

## Step 5: Database Schema

Store credentials in your database. Example schemas:

### SQL (PostgreSQL)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE credentials (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  transports TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE challenges (
  username VARCHAR(255) PRIMARY KEY,
  challenge VARCHAR(255) NOT NULL,
  user_id VARCHAR(255),
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_credentials_user_id ON credentials(user_id);
```

### MongoDB

```javascript
// User schema
{
  userId: { type: String, unique: true, required: true },
  username: { type: String, unique: true, required: true },
  displayName: { type: String, required: true },
  credentials: [{
    id: { type: String, required: true },
    publicKey: { type: String, required: true },
    counter: { type: Number, default: 0 },
    transports: [String],
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// Challenge schema
{
  username: { type: String, unique: true, required: true },
  challenge: { type: String, required: true },
  userId: String,
  expiresAt: { type: Date, required: true, index: true }
}
```

---

## Step 6: CORS Configuration

If your frontend and backend are on different domains:

### Express

```javascript
import cors from 'cors';

app.use(cors({
  origin: 'http://localhost:3000', // Your frontend URL
  credentials: true,
}));
```

### FastAPI

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Step 7: Testing

1. Start your backend server
2. Start your frontend
3. Test registration and authentication
4. Verify credentials are stored in your database

---

## Advanced Features

### Multiple Credentials per User

Allow users to register multiple passkeys:

```javascript
// Backend: Don't overwrite existing credentials
if (users.has(username)) {
  const user = users.get(username);
  user.credentials.push(newCredential);
} else {
  users.set(username, {
    userId,
    username,
    credentials: [newCredential],
  });
}
```

### Credential Management

```javascript
// List user's credentials
app.get('/api/passkey/credentials', authenticateUser, async (req, res) => {
  const user = users.get(req.user.username);
  res.json(user.credentials.map(c => ({
    id: c.id,
    createdAt: c.createdAt,
    transports: c.transports,
  })));
});

// Delete a credential
app.delete('/api/passkey/credentials/:id', authenticateUser, async (req, res) => {
  const user = users.get(req.user.username);
  user.credentials = user.credentials.filter(c => c.id !== req.params.id);
  res.json({ success: true });
});
```

### Passwordless Recovery

Implement email-based recovery:

```javascript
app.post('/api/auth/recovery/send', async (req, res) => {
  const { username } = req.body;
  const user = users.get(username);
  
  if (user) {
    const token = generateRecoveryToken();
    // Store token with expiration
    recoveryTokens.set(token, {
      username,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
    });
    
    // Send email with token
    await sendEmail(username, `Recovery link: /recovery?token=${token}`);
  }
  
  // Always return success to prevent user enumeration
  res.json({ success: true });
});
```

---

## Security Best Practices

1. **Use HTTPS in production**
2. **Validate RP_ID and Origin strictly**
3. **Store challenges with expiration**
4. **Implement rate limiting**
5. **Log authentication attempts**
6. **Use database transactions**
7. **Sanitize user inputs**
8. **Implement CSRF protection**
9. **Use secure session cookies**
10. **Monitor for anomalies**

---

## Resources

- [API Reference](./api-reference.md)
- [Package Documentation](../package/README.md)
- [@simplewebauthn/server Docs](https://simplewebauthn.dev/)
- [WebAuthn Guide](https://webauthn.guide/)
