import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CookieOptions, Response } from 'express';

export class LoginDto {
  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
    required: true
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

/**
 * RefreshTokenDto supports both camelCase and snake_case formats for refresh tokens.
 * This dual-format approach enhances compatibility with:
 * 1. OAuth2 standard which uses snake_case (refresh_token)
 * 2. JavaScript/TypeScript convention which uses camelCase (refreshToken)
 *
 * The API accepts either format for flexibility. If both are provided, 
 * refreshToken (camelCase) takes precedence.
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token in camelCase format (JavaScript convention). You can use either this or refresh_token.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false
  })
  @IsString()
  refreshToken?: string;

  @ApiProperty({
    description: 'Refresh token in snake_case format (OAuth2 standard). You can use either this or refreshToken.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false
  })
  @IsString()
  refresh_token?: string;
}

export class TokenPayload {
  @ApiProperty({
    description: 'User ID',
    example: '605a1cb9d4d5d73598045618'
  })
  sub: string; // subject (user ID)
  
  @ApiProperty({
    description: 'User email',
    example: 'user@example.com'
  })
  email: string;
  
  @ApiProperty({
    description: 'User role',
    example: 'admin',
    enum: ['admin', 'teacher', 'student']
  })
  role: string;
  
  @ApiProperty({
    description: 'Token creation timestamp',
    example: 1617979331
  })
  iat?: number; // issued at
  
  @ApiProperty({
    description: 'Token expiration timestamp',
    example: 1617982931
  })
  exp?: number; // expiration time
}

export class AuthTokens {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  accessToken: string;
  
  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  refreshToken: string;
}

/**
 * Interface for auth responses with cookie options
 */
export interface AuthResponseWithCookies {
  /**
   * The access token to be returned in the response body
   */
  accessToken: string;
  
  /**
   * The refresh token to be set as a cookie
   */
  refreshToken: string;
  
  /**
   * Cookie options for the refresh token
   */
  cookieOptions: CookieOptions;
  
  /**
   * The name of the cookie to set
   */
  cookieName: string;
} 