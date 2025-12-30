/**
 * Passkey service for handling WebAuthn operations
 */

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { randomBytes } from 'crypto';
import type { PasskeyStorage, PasskeyCredential } from './storage';
import { memoryStorage } from './memory-storage';

export interface PasskeyServiceConfig {
  rpName: string;
  rpID: string;
  origin: string;
  storage?: PasskeyStorage;
}

export class PasskeyService {
  private config: PasskeyServiceConfig;
  private storage: PasskeyStorage;

  constructor(config: PasskeyServiceConfig) {
    this.config = {
      rpName: config.rpName || 'Passkey Demo',
      rpID: config.rpID,
      origin: config.origin,
    };
    this.storage = config.storage || memoryStorage;
  }

  /**
   * Generate registration options for a new passkey
   */
  async generateRegistrationOptions(
    username: string,
    displayName: string,
    userId?: string
  ) {
    const userIdToUse = userId || this.generateUserId();

    // Check if user exists
    const existingUser = await this.storage.getUserByUsername(username);
    const excludeCredentials = existingUser?.credentials.map((cred) => ({
      id: Buffer.from(cred.id, 'base64url'),
      type: 'public-key' as const,
      transports: cred.transports as AuthenticatorTransport[] | undefined,
    })) || [];

    const options = await generateRegistrationOptions({
      rpName: this.config.rpName,
      rpID: this.config.rpID,
      userID: userIdToUse,
      userName: username,
      userDisplayName: displayName,
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
      },
    });

    // Save challenge
    await this.storage.saveChallenge({
      challenge: options.challenge,
      userId: userIdToUse,
      username,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    });

    return options;
  }

  /**
   * Verify registration response
   */
  async verifyRegistration(
    username: string,
    response: any
  ) {
    const challenge = await this.storage.getAndDeleteChallenge(username);
    if (!challenge) {
      throw new Error('Challenge not found or expired');
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge.challenge,
      expectedOrigin: this.config.origin,
      expectedRPID: this.config.rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new Error('Registration verification failed');
    }

    const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

    // Create credential
    const credential: PasskeyCredential = {
      id: Buffer.from(credentialID).toString('base64url'),
      publicKey: Buffer.from(credentialPublicKey).toString('base64url'),
      counter,
      transports: response.response.transports,
      createdAt: new Date(),
    };

    // Save or update user
    const existingUser = await this.storage.getUserByUsername(username);
    if (existingUser) {
      await this.storage.addCredential(username, credential);
    } else {
      await this.storage.saveUser({
        userId: challenge.userId,
        username,
        displayName: username,
        credentials: [credential],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return {
      verified: true,
      userId: challenge.userId,
      credentialId: credential.id,
    };
  }

  /**
   * Generate authentication options
   */
  async generateAuthenticationOptions(username?: string) {
    const allowCredentials = username
      ? await this.getAllowCredentials(username)
      : undefined;

    const options = await generateAuthenticationOptions({
      rpID: this.config.rpID,
      allowCredentials,
      userVerification: 'preferred',
    });

    // Save challenge
    await this.storage.saveChallenge({
      challenge: options.challenge,
      userId: '', // Will be determined during verification
      username: username || '',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    });

    return options;
  }

  /**
   * Verify authentication response
   */
  async verifyAuthentication(
    username: string | undefined,
    response: any
  ) {
    const challenge = await this.storage.getAndDeleteChallenge(username || '');
    if (!challenge) {
      throw new Error('Challenge not found or expired');
    }

    // Get user by credential ID
    const user = await this.storage.getUserByCredentialId(response.id);
    if (!user) {
      throw new Error('User not found');
    }

    // Find the credential
    const credential = user.credentials.find((c) => c.id === response.id);
    if (!credential) {
      throw new Error('Credential not found');
    }

    // Verify authentication
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge.challenge,
      expectedOrigin: this.config.origin,
      expectedRPID: this.config.rpID,
      authenticator: {
        credentialID: Buffer.from(credential.id, 'base64url'),
        credentialPublicKey: Buffer.from(credential.publicKey, 'base64url'),
        counter: credential.counter,
      },
    });

    if (!verification.verified) {
      throw new Error('Authentication verification failed');
    }

    // Update counter
    await this.storage.updateCredentialCounter(
      credential.id,
      verification.authenticationInfo.newCounter
    );

    return {
      verified: true,
      userId: user.userId,
      username: user.username,
    };
  }

  /**
   * Helper to get allow credentials for a user
   */
  private async getAllowCredentials(username: string) {
    const user = await this.storage.getUserByUsername(username);
    if (!user) {
      return [];
    }

    return user.credentials.map((cred) => ({
      id: Buffer.from(cred.id, 'base64url'),
      type: 'public-key' as const,
      transports: cred.transports as AuthenticatorTransport[] | undefined,
    }));
  }

  /**
   * Generate a random user ID
   * @returns A base64url-encoded random string (32 bytes) suitable for use as a unique user identifier
   * @private
   */
  private generateUserId(): string {
    // Use Node.js crypto module for random bytes
    return randomBytes(32).toString('base64url');
  }
}
