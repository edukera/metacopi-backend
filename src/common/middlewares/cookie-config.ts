import { ConfigService } from '@nestjs/config';
import { CookieOptions } from 'express';
import { Logger } from '@nestjs/common';

const logger = new Logger('CookieConfig');

/**
 * Constants for token expiration times
 */
export const TOKEN_EXPIRATION = {
  ACCESS_TOKEN: '15m',  // 15 minutes
  REFRESH_TOKEN: '7d',  // 7 days
};

/**
 * Convert expiration string to milliseconds
 * @param expiration Expiration string (e.g., '15m', '7d')
 */
export const expirationToMs = (expiration: string): number => {
  const unit = expiration.charAt(expiration.length - 1);
  const value = parseInt(expiration.slice(0, -1), 10);
  
  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      logger.warn(`Unknown expiration unit: ${unit}, defaulting to seconds`);
      return value * 1000;
  }
};

/**
 * Get cookie configuration for refresh tokens
 * @param configService The NestJS ConfigService
 */
export const getRefreshTokenCookieConfig = (configService: ConfigService): CookieOptions => {
  const isProduction = configService.get<string>('environment') === 'production';
  const refreshTokenExpiration = configService.get<string>('auth.refreshTokenExpiresIn') || TOKEN_EXPIRATION.REFRESH_TOKEN;
  
  logger.debug(`Creating refresh token cookie config with expiration: ${refreshTokenExpiration}, secure: ${isProduction}`);
  
  return {
    httpOnly: true, // Prevent client-side JavaScript from accessing the cookie
    secure: isProduction, // Only send over HTTPS in production
    sameSite: isProduction ? 'strict' : 'lax', // Protect against CSRF attacks in production
    maxAge: expirationToMs(refreshTokenExpiration), // Convert from string to milliseconds
    path: '/auth', // Only allow cookie to be sent to auth endpoints
  };
};

/**
 * Configure CORS options with credentials
 * @param configService The NestJS ConfigService
 */
export const getCorsOptions = (configService: ConfigService) => {
  const isProduction = configService.get<string>('environment') === 'production';
  const frontendUrl = configService.get<string>('frontendUrl');
  const allowedOrigins = configService.get<string[]>('allowedOrigins');
  
  logger.debug(`Configuring CORS with credentials and origins: ${isProduction ? JSON.stringify(allowedOrigins) : frontendUrl}`);
  
  return {
    origin: isProduction ? allowedOrigins : frontendUrl,
    credentials: true, // Allow credentials (cookies) to be sent
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  };
}; 