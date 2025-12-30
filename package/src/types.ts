/**
 * Passkey credential options
 */
export interface PasskeyCredential {
  id: string;
  publicKey: string;
  counter: number;
  transports?: AuthenticatorTransport[];
}

/**
 * Registration options for passkey
 */
export interface RegistrationOptions {
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: PublicKeyCredentialParameters[];
  timeout?: number;
  authenticatorSelection?: AuthenticatorSelectionCriteria;
  attestation?: AttestationConveyancePreference;
}

/**
 * Authentication options for passkey
 */
export interface AuthenticationOptions {
  challenge: string;
  rpId?: string;
  allowCredentials?: PublicKeyCredentialDescriptor[];
  timeout?: number;
  userVerification?: UserVerificationRequirement;
}

/**
 * Registration response from passkey
 */
export interface RegistrationResponse {
  id: string;
  rawId: ArrayBuffer;
  response: {
    clientDataJSON: ArrayBuffer;
    attestationObject: ArrayBuffer;
  };
  type: string;
}

/**
 * Authentication response from passkey
 */
export interface AuthenticationResponse {
  id: string;
  rawId: ArrayBuffer;
  response: {
    clientDataJSON: ArrayBuffer;
    authenticatorData: ArrayBuffer;
    signature: ArrayBuffer;
    userHandle?: ArrayBuffer;
  };
  type: string;
}

/**
 * Passkey API client configuration
 */
export interface PasskeyClientConfig {
  apiUrl?: string;
  customFetch?: typeof fetch;
}

/**
 * Result of passkey operation
 */
export interface PasskeyResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * State for the usePasskey hook
 */
export interface UsePasskeyState {
  isLoading: boolean;
  error: string | null;
  isSupported: boolean;
}

/**
 * Return type for the usePasskey hook
 */
export interface UsePasskeyReturn extends UsePasskeyState {
  register: (username: string, displayName: string, userId?: string) => Promise<PasskeyResult>;
  authenticate: (username?: string) => Promise<PasskeyResult>;
  clearError: () => void;
}
