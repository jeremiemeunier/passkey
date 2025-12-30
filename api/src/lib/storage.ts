/**
 * Storage interface for passkey credentials
 * Implement this interface to use your own storage backend
 */

export interface PasskeyCredential {
  id: string;
  publicKey: string;
  counter: number;
  transports?: string[];
  createdAt: Date;
}

export interface UserPasskey {
  userId: string;
  username: string;
  displayName: string;
  credentials: PasskeyCredential[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Challenge {
  challenge: string;
  userId: string;
  username: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface PasskeyStorage {
  /**
   * Save a user with their passkey credentials
   */
  saveUser(user: UserPasskey): Promise<void>;

  /**
   * Get a user by username
   */
  getUserByUsername(username: string): Promise<UserPasskey | null>;

  /**
   * Get a user by credential ID
   */
  getUserByCredentialId(credentialId: string): Promise<UserPasskey | null>;

  /**
   * Add a credential to a user
   */
  addCredential(username: string, credential: PasskeyCredential): Promise<void>;

  /**
   * Update credential counter (for replay attack prevention)
   */
  updateCredentialCounter(credentialId: string, counter: number): Promise<void>;

  /**
   * Save a challenge for registration or authentication
   */
  saveChallenge(challenge: Challenge): Promise<void>;

  /**
   * Get and delete a challenge (single-use)
   */
  getAndDeleteChallenge(username: string): Promise<Challenge | null>;

  /**
   * Clean up expired challenges
   */
  cleanupExpiredChallenges(): Promise<void>;
}
