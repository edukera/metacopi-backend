/**
 * Constants for authentication
 */
export const AUTH_CONSTANTS = {
  // Cookie names
  COOKIE_NAMES: {
    REFRESH_TOKEN: 'metacopi_refresh_token',
  },
  
  // Token types
  TOKEN_TYPE: {
    ACCESS: 'access',
    REFRESH: 'refresh',
  },
  
  // Default expiration times
  EXPIRATION: {
    ACCESS_TOKEN: '15m',  // 15 minutes
    REFRESH_TOKEN: '7d',  // 7 days
  },
}; 