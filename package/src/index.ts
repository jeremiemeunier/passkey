/**
 * @passkey/client - Client-side passkey authentication package
 * 
 * This package provides a simple interface for implementing passkey authentication
 * in your web application with React support.
 */

export { PasskeyClient } from './client';
export { usePasskey } from './usePasskey';
export type {
  PasskeyCredential,
  RegistrationOptions,
  AuthenticationOptions,
  RegistrationResponse,
  AuthenticationResponse,
  PasskeyClientConfig,
  PasskeyResult,
  UsePasskeyState,
  UsePasskeyReturn,
} from './types';
export {
  arrayBufferToBase64Url,
  base64UrlToArrayBuffer,
  stringToArrayBuffer,
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
} from './utils';
