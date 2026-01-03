# Migration Guide - Fix User ID Resolution

## Problem Resolved

The system had an issue where user identifiers were not correctly retrieved during authentication. This caused "User not found" errors or ID inconsistencies.

## Changes Made

### 1. Memory Storage (`memory-storage.ts`)

- Improved challenge storage to use consistent keys (username or empty string for usernameless flows)
- Simplified cleanup of expired challenges to match the streamlined storage structure

### 2. Passkey Service (`passkey-service.ts`)

#### Registration

- Ensured the challenge `userId` is used consistently
- If the user already exists, their existing `userId` is reused

#### Authentication

- Retrieved user via `getUserByCredentialId` first
- Fixed challenge retrieval for usernameless authentication flows
- Challenge is now correctly retrieved using the same key it was saved with (empty string for usernameless, or the provided username)

## Migration for Custom Implementations

If you have implemented the `PasskeyStorage` interface with your own database, you need to ensure proper challenge storage:

### Breaking Change: Remove getAndDeleteChallengeByValue

The `getAndDeleteChallengeByValue` method has been removed from the `PasskeyStorage` interface as it was never used. If you previously implemented this method, you should:

1. Remove the `getAndDeleteChallengeByValue` method from your storage implementation
2. Remove any dual-indexing logic (e.g., indexing challenges by both username and challenge value)
3. Simplify your challenge storage to only index by username

### Optimize challenge storage

Challenges should be stored and retrieved by username. For usernameless (discoverable) authentication, an empty string is used as the key.

**Example with Prisma:**

```prisma
model Challenge {
  id          String   @id @default(cuid())
  challenge   String   @unique
  userId      String
  username    String
  createdAt   DateTime
  expiresAt   DateTime

  @@index([username])
  @@index([challenge])
}
```

### Ensure userId consistency

Make sure that:

- The `userId` generated during registration is unique and persistent
- The same `userId` is always returned for the same user
- The `credentialId -> userId` index allows quick user retrieval

## Recommended Tests

After migration, test the following scenarios:

1. **Registering a new user**

   - Verify that the `userId` is generated and saved
   - Verify that the credential is properly indexed

2. **Authentication with username**

   - Verify that the challenge is found
   - Verify that the user is correctly identified
   - Verify that the returned `userId` matches the one from registration

3. **Discoverable authentication (without username)**

   - Verify that the user is found via credentialId
   - Verify that the challenge is retrieved correctly
   - Verify that the `userId` is consistent

4. **Adding a second passkey**
   - Verify that the existing user is updated
   - Verify that the `userId` remains the same
   - Verify that both credentials are indexed

## Support

If you encounter issues during migration, check that:

- Your `PasskeyStorage` implementation includes all required methods
- Database indexes are properly configured
- Expired challenges are regularly cleaned up
