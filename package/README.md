# @passkey/client

Client-side passkey authentication package with React hook support.

## Installation

```bash
npm install @passkey/client
```

## Features

- 🔐 Simple passkey registration and authentication
- ⚛️ React hook for easy integration
- 🎯 TypeScript support with full type definitions
- 🌐 WebAuthn standard compliant
- 🔌 Works with any backend API
- 📦 Lightweight and tree-shakeable

## Quick Start

### React Hook

```tsx
import { usePasskey } from '@passkey/client';

function LoginPage() {
  const { register, authenticate, isLoading, error, isSupported } = usePasskey({
    apiUrl: '/api/passkey', // Optional: defaults to '/api/passkey'
  });

  const handleRegister = async () => {
    const result = await register('user@example.com', 'John Doe');
    if (result.success) {
      console.log('Registration successful!', result.data);
    }
  };

  const handleLogin = async () => {
    const result = await authenticate('user@example.com');
    if (result.success) {
      console.log('Login successful!', result.data);
    }
  };

  if (!isSupported) {
    return <p>Passkeys are not supported in this browser</p>;
  }

  return (
    <div>
      <button onClick={handleRegister} disabled={isLoading}>
        Register with Passkey
      </button>
      <button onClick={handleLogin} disabled={isLoading}>
        Login with Passkey
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
```

### Vanilla JavaScript

```javascript
import { PasskeyClient } from '@passkey/client';

const client = new PasskeyClient({
  apiUrl: '/api/passkey',
});

// Register
const registerResult = await client.register(
  'user@example.com',
  'John Doe'
);

if (registerResult.success) {
  console.log('Registration successful!');
}

// Authenticate
const authResult = await client.authenticate('user@example.com');

if (authResult.success) {
  console.log('Login successful!');
}
```

## API Reference

### `usePasskey(config?)`

React hook for passkey authentication.

**Parameters:**
- `config` (optional): Configuration object
  - `apiUrl` (string): API endpoint URL (default: '/api/passkey')
  - `customFetch` (function): Custom fetch implementation

**Returns:**
- `register(username, displayName, userId?)`: Register a new passkey
- `authenticate(username?)`: Authenticate with a passkey
- `isLoading` (boolean): Loading state
- `error` (string | null): Error message if any
- `isSupported` (boolean): Whether passkeys are supported
- `clearError()`: Clear error state

### `PasskeyClient`

Class for direct passkey operations without React.

**Constructor:**
```typescript
new PasskeyClient(config?: PasskeyClientConfig)
```

**Methods:**
- `isSupported()`: Check if passkeys are supported
- `register(username, displayName, userId?)`: Register a new passkey
- `authenticate(username?)`: Authenticate with a passkey

## Utility Functions

```typescript
import {
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
  arrayBufferToBase64Url,
  base64UrlToArrayBuffer,
} from '@passkey/client';

// Check browser support
if (isWebAuthnSupported()) {
  console.log('WebAuthn is supported!');
}

// Check platform authenticator
const hasAuthenticator = await isPlatformAuthenticatorAvailable();
```

## Backend Integration

This package works with any backend API that implements the passkey protocol. See the `docs` folder for implementation guides:

- [Implementation with the included API](../docs/guide-with-api.md)
- [Implementation with your own API](../docs/guide-without-api.md)
- [API Reference](../docs/api-reference.md)

## Browser Support

This package requires WebAuthn support:
- Chrome/Edge 67+
- Firefox 60+
- Safari 13+

## License

MIT
