/**
 * In-memory storage implementation
 *
 * ⚠️ WARNING: FOR DEVELOPMENT/TESTING ONLY ⚠️
 *
 * This storage implementation:
 * - Stores all data in memory (lost on server restart)
 * - Does not persist across multiple instances
 * - Is NOT suitable for production use
 * - Should ONLY be used for local development and testing
 *
 * For production, implement the PasskeyStorage interface with a proper database.
 */

import type {
  PasskeyStorage,
  UserPasskey,
  PasskeyCredential,
  Challenge,
} from "./storage";

export class MemoryStorage implements PasskeyStorage {
  private users: Map<string, UserPasskey> = new Map();
  private credentialIndex: Map<string, string> = new Map(); // credentialId -> username
  private challenges: Map<string, Challenge> = new Map(); // username -> challenge
  private challengesByValue: Map<string, Challenge> = new Map(); // challenge -> Challenge

  constructor() {
    if (process.env.NODE_ENV === "production") {
      const errorMsg =
        "❌ CRITICAL ERROR: MemoryStorage is being used in production! " +
        "This will cause data loss and security vulnerabilities. " +
        "You must implement the PasskeyStorage interface with a proper database.";
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  async saveUser(user: UserPasskey): Promise<void> {
    this.users.set(user.username, user);
    // Index all credentials
    user.credentials.forEach((cred) => {
      this.credentialIndex.set(cred.id, user.username);
    });
  }

  async getUserByUsername(username: string): Promise<UserPasskey | null> {
    return this.users.get(username) || null;
  }

  async getUserByCredentialId(
    credentialId: string
  ): Promise<UserPasskey | null> {
    const username = this.credentialIndex.get(credentialId);
    if (!username) return null;
    return this.users.get(username) || null;
  }

  async addCredential(
    username: string,
    credential: PasskeyCredential
  ): Promise<void> {
    const user = this.users.get(username);
    if (!user) {
      throw new Error("User not found");
    }

    user.credentials.push(credential);
    user.updatedAt = new Date();
    this.credentialIndex.set(credential.id, username);
    this.users.set(username, user);
  }

  async updateCredentialCounter(
    credentialId: string,
    counter: number
  ): Promise<void> {
    const username = this.credentialIndex.get(credentialId);
    if (!username) {
      throw new Error("Credential not found");
    }

    const user = this.users.get(username);
    if (!user) {
      throw new Error("User not found");
    }

    const credential = user.credentials.find((c) => c.id === credentialId);
    if (!credential) {
      throw new Error("Credential not found");
    }

    credential.counter = counter;
    user.updatedAt = new Date();
    this.users.set(username, user);
  }

  async saveChallenge(challenge: Challenge): Promise<void> {
    this.challenges.set(challenge.username || challenge.challenge, challenge);
    this.challengesByValue.set(challenge.challenge, challenge);
  }

  async getAndDeleteChallenge(username: string): Promise<Challenge | null> {
    const challenge = this.challenges.get(username) || null;
    if (challenge) {
      this.challenges.delete(username);
      this.challengesByValue.delete(challenge.challenge);
    }
    return challenge;
  }

  async getAndDeleteChallengeByValue(
    challengeValue: string
  ): Promise<Challenge | null> {
    const challenge = this.challengesByValue.get(challengeValue) || null;
    if (challenge) {
      this.challengesByValue.delete(challengeValue);
      this.challenges.delete(challenge.username || challengeValue);
    }
    return challenge;
  }

  async cleanupExpiredChallenges(): Promise<void> {
    const now = new Date();
    for (const [key, challenge] of this.challenges.entries()) {
      if (challenge.expiresAt < now) {
        this.challenges.delete(key);
        this.challengesByValue.delete(challenge.challenge);
      }
    }
  }
}

// Singleton instance for development
export const memoryStorage = new MemoryStorage();
