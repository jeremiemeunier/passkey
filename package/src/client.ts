import {
  startRegistration,
  startAuthentication,
} from "@simplewebauthn/browser";
import type { PasskeyClientConfig, PasskeyResult } from "./types";
import { isWebAuthnSupported } from "./utils";
import axios from "axios";

/**
 * Passkey Client for handling registration and authentication
 */
export class PasskeyClient {
  private config: Required<PasskeyClientConfig>;

  constructor(config: PasskeyClientConfig = {}) {
    this.config = {
      apiUrl: config.apiUrl || "/api/passkey",
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
        error: "Passkeys are not supported in this browser",
      };
    }

    try {
      // Get registration options from server
      const optionsResponse = await axios.post(
        `${this.config.apiUrl}/register/options`,
        {
          username,
          displayName,
          userId,
        }
      );

      if (optionsResponse.status !== 200) {
        const errorData = optionsResponse.data || {};
        const errorMessage =
          errorData.error ||
          `Failed to get registration options: ${optionsResponse.status} ${optionsResponse.statusText}`;
        throw new Error(errorMessage);
      }

      const options = optionsResponse.data;

      // Start WebAuthn registration
      const credential = await startRegistration(options);

      // Verify registration with server
      const verifyResponse = await axios.post(
        `${this.config.apiUrl}/register/verify`,
        {
          username,
          credential,
        }
      );

      if (verifyResponse.status !== 200) {
        const errorData = verifyResponse.data || {};
        const errorMessage =
          errorData.error ||
          `Failed to verify registration: ${verifyResponse.status} ${verifyResponse.statusText}`;
        throw new Error(errorMessage);
      }

      const result = verifyResponse.data;
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Registration failed",
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
        error: "Passkeys are not supported in this browser",
      };
    }

    try {
      // Get authentication options from server
      const optionsResponse = await axios.post(
        `${this.config.apiUrl}/authenticate/options`,
        {
          username,
        }
      );

      if (optionsResponse.status !== 200) {
        const errorData = optionsResponse.data || {};
        const errorMessage =
          errorData.error ||
          `Failed to get authentication options: ${optionsResponse.status} ${optionsResponse.statusText}`;
        throw new Error(errorMessage);
      }

      const options = optionsResponse.data;
      // Start WebAuthn authentication
      const credential = await startAuthentication(options);

      // Verify authentication with server
      const verifyResponse = await axios.post(
        `${this.config.apiUrl}/authenticate/verify`,
        {
          username,
          credential,
        }
      );

      if (verifyResponse.status !== 200) {
        const errorData = verifyResponse.data || {};
        const errorMessage =
          errorData.error ||
          `Failed to verify authentication: ${verifyResponse.status} ${verifyResponse.statusText}`;
        throw new Error(errorMessage);
      }

      const result = verifyResponse.data;
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Authentication failed",
      };
    }
  }
}
