import {
  startRegistration,
  startAuthentication,
} from '@simplewebauthn/browser';
import type {
  RegistrationOptions,
  AuthenticationOptions,
  PasskeyClientConfig,
  PasskeyResult,
} from './types';
import {
  isWebAuthnSupported,
} from './utils';

/**
 * Passkey Client for handling registration and authentication
 */
export class PasskeyClient {
  private config: Required<PasskeyClientConfig>;

  constructor(config: PasskeyClientConfig = {}) {
    this.config = {
      apiUrl: config.apiUrl || '/api/passkey',
      customFetch: config.customFetch || fetch,
    };
  }

  /**
   * Check if passkeys are supported
   */
  isSupported(): boolean {
    return isWebAuthnSupported();
  }

  /**
   * Register a new passkey
   */
  async register(
    username: string,
    displayName: string,
    userId?: string
  ): Promise<PasskeyResult> {
    if (!this.isSupported()) {
      return {
        success: false,
        error: 'Passkeys are not supported in this browser',
      };
    }

    try {
      // Get registration options from server
      const optionsResponse = await this.config.customFetch(
        `${this.config.apiUrl}/register/options`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            displayName,
            userId,
          }),
        }
      );

      if (!optionsResponse.ok) {
        const errorData = await optionsResponse.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to get registration options: ${optionsResponse.status} ${optionsResponse.statusText}`;
        throw new Error(errorMessage);
      }

      const options = await optionsResponse.json();

      // Start WebAuthn registration
      const credential = await startRegistration(options);

      // Verify registration with server
      const verifyResponse = await this.config.customFetch(
        `${this.config.apiUrl}/register/verify`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            credential,
          }),
        }
      );

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to verify registration: ${verifyResponse.status} ${verifyResponse.statusText}`;
        throw new Error(errorMessage);
      }

      const result = await verifyResponse.json();

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }

  /**
   * Authenticate with a passkey
   */
  async authenticate(username?: string): Promise<PasskeyResult> {
    if (!this.isSupported()) {
      return {
        success: false,
        error: 'Passkeys are not supported in this browser',
      };
    }

    try {
      // Get authentication options from server
      const optionsResponse = await this.config.customFetch(
        `${this.config.apiUrl}/authenticate/options`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        }
      );

      if (!optionsResponse.ok) {
        const errorData = await optionsResponse.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to get authentication options: ${optionsResponse.status} ${optionsResponse.statusText}`;
        throw new Error(errorMessage);
      }

      const options = await optionsResponse.json();

      // Start WebAuthn authentication
      const credential = await startAuthentication(options);

      // Verify authentication with server
      const verifyResponse = await this.config.customFetch(
        `${this.config.apiUrl}/authenticate/verify`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            credential,
          }),
        }
      );

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to verify authentication: ${verifyResponse.status} ${verifyResponse.statusText}`;
        throw new Error(errorMessage);
      }

      const result = await verifyResponse.json();

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  }
}
