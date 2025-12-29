import { useState, useCallback, useMemo } from 'react';
import { PasskeyClient } from './client';
import type { PasskeyClientConfig, PasskeyResult, UsePasskeyReturn } from './types';

/**
 * React hook for passkey authentication
 * 
 * @param config - Configuration for the passkey client
 * @returns Passkey state and methods
 * 
 * @example
 * ```tsx
 * function LoginPage() {
 *   const { register, authenticate, isLoading, error } = usePasskey();
 * 
 *   const handleRegister = async () => {
 *     const result = await register('user@example.com', 'User Name');
 *     if (result.success) {
 *       console.log('Registration successful');
 *     }
 *   };
 * 
 *   const handleLogin = async () => {
 *     const result = await authenticate('user@example.com');
 *     if (result.success) {
 *       console.log('Login successful');
 *     }
 *   };
 * 
 *   return (
 *     <div>
 *       <button onClick={handleRegister} disabled={isLoading}>Register</button>
 *       <button onClick={handleLogin} disabled={isLoading}>Login</button>
 *       {error && <p>{error}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePasskey(config?: PasskeyClientConfig): UsePasskeyReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize config to prevent unnecessary re-renders
  const apiUrl = config?.apiUrl;
  const customFetch = config?.customFetch;

  // Create passkey client instance
  const client = useMemo(
    () => new PasskeyClient({ apiUrl, customFetch }),
    [apiUrl, customFetch]
  );

  // Check if passkeys are supported
  const isSupported = useMemo(() => client.isSupported(), [client]);

  /**
   * Register a new passkey
   */
  const register = useCallback(
    async (username: string, displayName: string, userId?: string): Promise<PasskeyResult> => {
      setIsLoading(true);
      setError(null);

      const result = await client.register(username, displayName, userId);

      if (!result.success && result.error) {
        setError(result.error);
      }

      setIsLoading(false);
      return result;
    },
    [client]
  );

  /**
   * Authenticate with a passkey
   */
  const authenticate = useCallback(
    async (username?: string): Promise<PasskeyResult> => {
      setIsLoading(true);
      setError(null);

      const result = await client.authenticate(username);

      if (!result.success && result.error) {
        setError(result.error);
      }

      setIsLoading(false);
      return result;
    },
    [client]
  );

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    register,
    authenticate,
    isLoading,
    error,
    isSupported,
    clearError,
  };
}
