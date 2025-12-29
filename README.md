# Passkey Authentication System

A complete, production-ready passkey (WebAuthn) authentication system with client package, serverless API, and comprehensive documentation.

## 🚀 Features

- **📦 Client Package** - React hook and vanilla JS client for easy integration
- **🔌 Serverless API** - Next.js-based API ready for Vercel, Netlify, AWS Lambda, etc.
- **📚 Complete Documentation** - API reference and implementation guides
- **🔐 Secure** - Implements WebAuthn standard with best practices
- **⚡ Easy to Use** - Get started in minutes with minimal code
- **🎨 Flexible** - Use with the included API or your own backend
- **💪 TypeScript** - Full type safety and intellisense

## 📁 Repository Structure

```
passkey/
├── package/          # @passkey/client - Client-side library
│   ├── src/
│   └── README.md
├── api/              # @passkey/api - Serverless API
│   ├── src/
│   └── README.md
└── docs/             # Documentation
    ├── api-reference.md
    ├── guide-with-api.md
    └── guide-without-api.md
```

## 🎯 Quick Start

### Option 1: Using the Included API (Recommended for New Projects)

Perfect for serverless deployments and quick prototyping.

1. **Install and run the API:**
   ```bash
   cd api
   npm install
   cp .env.example .env.local
   npm run dev
   ```

2. **Install the client package in your app:**
   ```bash
   npm install @passkey/client
   ```

3. **Use in your React app:**
   ```tsx
   import { usePasskey } from '@passkey/client';
   
   function LoginPage() {
     const { register, authenticate, isLoading } = usePasskey();
     
     const handleRegister = async () => {
       const result = await register('user@example.com', 'John Doe');
       if (result.success) {
         console.log('Registered!');
       }
     };
     
     const handleLogin = async () => {
       const result = await authenticate('user@example.com');
       if (result.success) {
         console.log('Logged in!');
       }
     };
     
     return (
       <div>
         <button onClick={handleRegister} disabled={isLoading}>
           Register
         </button>
         <button onClick={handleLogin} disabled={isLoading}>
           Login
         </button>
       </div>
     );
   }
   ```

📖 [Full Guide: Using the Included API](docs/guide-with-api.md)

### Option 2: Using Your Own Backend

Perfect for existing projects with established backends.

1. **Install the client package:**
   ```bash
   npm install @passkey/client
   ```

2. **Implement 4 API endpoints** in your backend:
   - `POST /register/options`
   - `POST /register/verify`
   - `POST /authenticate/options`
   - `POST /authenticate/verify`

3. **Connect the client to your API:**
   ```tsx
   const { register, authenticate } = usePasskey({
     apiUrl: 'https://your-api.com/passkey'
   });
   ```

📖 [Full Guide: Using Your Own Backend](docs/guide-without-api.md)

## 📦 Packages

### Client Package (@passkey/client)

Client-side library for passkey authentication with React hook support.

```bash
npm install @passkey/client
```

**Features:**
- React hook (`usePasskey`)
- Vanilla JS client (`PasskeyClient`)
- TypeScript support
- Utility functions
- Lightweight (< 10KB)

[📖 Package Documentation](package/README.md)

### API (@passkey/api)

Serverless API for passkey authentication built with Next.js.

```bash
cd api
npm install
npm run dev
```

**Features:**
- 4 REST endpoints for complete auth flow
- Pluggable storage interface
- In-memory storage (dev) and database-ready
- Environment-based configuration
- Vercel/Netlify/AWS Lambda ready

[📖 API Documentation](api/README.md)

## 📚 Documentation

- **[API Reference](docs/api-reference.md)** - Complete API endpoint documentation
- **[Guide: With API](docs/guide-with-api.md)** - Step-by-step guide using the included API
- **[Guide: Without API](docs/guide-without-api.md)** - Step-by-step guide for custom backends

## 🔧 Development

### Install Dependencies

```bash
# Install all workspace dependencies
npm install

# Install specific workspace
npm install --workspace=package
npm install --workspace=api
```

### Build

```bash
# Build all packages
npm run build

# Build specific package
npm run build --workspace=package
```

### Run Development Servers

```bash
# API server
npm run dev:api

# Package (watch mode)
npm run dev:package
```

## 🌐 Browser Support

Passkeys require WebAuthn support:

| Browser | Version |
|---------|---------|
| Chrome/Edge | 67+ |
| Firefox | 60+ |
| Safari | 13+ |

## 🔐 Security

This system implements WebAuthn best practices:

- ✅ HTTPS required (except localhost)
- ✅ Challenge-based authentication
- ✅ Single-use challenges with expiration
- ✅ Signature counter tracking (replay attack prevention)
- ✅ Origin validation
- ✅ Relying Party ID validation
- ✅ User verification support
- ✅ Resident key support

**Production Checklist:**
- Use HTTPS
- Set correct `RP_ID` and `ORIGIN`
- Use a proper database (not in-memory storage)
- Implement session management
- Enable rate limiting
- Monitor authentication attempts
- Keep dependencies updated

## 🚀 Deployment

### Vercel (Recommended)

```bash
cd api
vercel
```

Set environment variables:
- `RP_NAME` - Your app name
- `RP_ID` - Your domain (e.g., `myapp.com`)
- `ORIGIN` - Your full URL (e.g., `https://myapp.com`)

### Netlify

```bash
cd api
netlify deploy --prod
```

### Other Platforms

The API works on any platform supporting Next.js:
- AWS Lambda (via Serverless Next.js)
- Google Cloud Functions
- Azure Functions
- Cloudflare Workers

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT

## 🔗 Resources

- [WebAuthn Specification](https://www.w3.org/TR/webauthn/)
- [Passkeys.dev](https://passkeys.dev/)
- [SimpleWebAuthn](https://simplewebauthn.dev/)
- [WebAuthn Guide](https://webauthn.guide/)

## 💡 Examples

### React with TypeScript
```tsx
import { usePasskey } from '@passkey/client';
import { useState } from 'react';

export function PasskeyAuth() {
  const [email, setEmail] = useState('');
  const { register, authenticate, isLoading, error, isSupported } = usePasskey();

  if (!isSupported) {
    return <div>Passkeys not supported in this browser</div>;
  }

  return (
    <div>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <button 
        onClick={() => register(email, email)} 
        disabled={isLoading}
      >
        Register
      </button>
      <button 
        onClick={() => authenticate(email)} 
        disabled={isLoading}
      >
        Login
      </button>
      {error && <p>{error}</p>}
    </div>
  );
}
```

### Vanilla JavaScript
```javascript
import { PasskeyClient } from '@passkey/client';

const client = new PasskeyClient({ apiUrl: '/api/passkey' });

// Register
const registerResult = await client.register(
  'user@example.com',
  'John Doe'
);

// Authenticate
const authResult = await client.authenticate('user@example.com');
```

### Next.js App Router
```tsx
'use client';
import { usePasskey } from '@passkey/client';

export default function LoginPage() {
  const passkey = usePasskey({ apiUrl: '/api/passkey' });
  
  return (
    <main>
      <h1>Login with Passkey</h1>
      <button onClick={() => passkey.register('user@example.com', 'User')}>
        Register
      </button>
      <button onClick={() => passkey.authenticate('user@example.com')}>
        Login
      </button>
    </main>
  );
}
```

## ❓ FAQ

**Q: Do I need to use the included API?**  
A: No, you can use your own backend. The client package works with any API that implements the WebAuthn protocol.

**Q: Can I use this with Next.js App Router?**  
A: Yes! The `usePasskey` hook works in client components. Just add `'use client'` directive.

**Q: How do I store credentials in a database?**  
A: Implement the `PasskeyStorage` interface and pass it to `PasskeyService`. See the guides for examples.

**Q: Is this production-ready?**  
A: Yes, but replace the in-memory storage with a proper database and implement session management.

**Q: Can users have multiple passkeys?**  
A: Yes, the system supports multiple credentials per user.

**Q: What about account recovery?**  
A: Implement email-based recovery or allow multiple passkeys. See the guides for examples.

## 🎉 Get Started

Choose your path:

1. **Quick Start** → [Using the Included API](docs/guide-with-api.md)
2. **Custom Backend** → [Using Your Own API](docs/guide-without-api.md)
3. **API Reference** → [Complete API Docs](docs/api-reference.md)

---

Built with ❤️ using WebAuthn and SimpleWebAuthn