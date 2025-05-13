import { Controller, Post, UseGuards, Body, Get, UsePipes, ValidationPipe, HttpCode, HttpStatus, BadRequestException, Logger, Res, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, AuthTokens } from './dto/auth.dto';
import { User } from '../users/user.interface';
import { JwtAuthGuard, Public } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiCookieAuth } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { AUTH_CONSTANTS } from './auth.constants';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: 'User login', description: 'Authenticates a user and returns JWT access token, with refresh token in HttpOnly cookie' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        user: { 
          type: 'object', 
          properties: {
            _id: { type: 'string', example: '605a1cb9d4d5d73598045618' },
            email: { type: 'string', example: 'user@example.com' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            role: { type: 'string', example: 'teacher' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<{
    access_token: string;
    user: Partial<User>;
  }> {
    this.logger.debug(`Login attempt for email: ${loginDto.email}`);
    
    try {
      // Get the user to include in the response
      const user = await this.authService.validateUser(loginDto.email, loginDto.password);
      
      if (!user) {
        throw new BadRequestException({
          message: 'Invalid credentials',
          debug: `User validation failed for email: ${loginDto.email}`
        });
      }
      
      // Get tokens with cookie configuration
      const authResponse = await this.authService.loginWithCookies(loginDto);
      
      // Set the refresh token as an HttpOnly cookie
      response.cookie(
        authResponse.cookieName,
        authResponse.refreshToken,
        authResponse.cookieOptions
      );
      
      this.logger.debug(`Set refresh token cookie for user: ${loginDto.email}`);
      
      // Return only the access token in the response body
      return {
        access_token: authResponse.accessToken,
        user: user,
      };
    } catch (error) {
      this.logger.error(`Login error for ${loginDto.email}: ${error.message}`);
      throw new BadRequestException({
        message: 'Invalid credentials',
        debug: `Error during login: ${error.message}`
      });
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User logout', description: 'Invalidates the connected user\'s tokens and clears cookies' })
  @ApiResponse({ 
    status: 200, 
    description: 'Logout successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Logout successful' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Missing or invalid token' })
  async logout(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) response: Response
  ) {
    this.logger.debug(`Logout attempt for user id: ${user.id}`);
    
    try {
      await this.authService.invalidateUserTokens(user.id);
      
      // Clear the refresh token cookie
      response.clearCookie(AUTH_CONSTANTS.COOKIE_NAMES.REFRESH_TOKEN);
      
      this.logger.debug(`Cleared refresh token cookie for user: ${user.id}`);
      
      return { message: 'Logout successful' };
    } catch (error) {
      this.logger.error(`Logout error for user ${user.id}: ${error.message}`);
      throw new BadRequestException({
        message: 'Error during logout',
        debug: `Error during logout: ${error.message}`
      });
    }
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Refresh tokens', description: 'Generates new tokens from the refresh token cookie' })
  @ApiCookieAuth(AUTH_CONSTANTS.COOKIE_NAMES.REFRESH_TOKEN)
  @ApiResponse({ 
    status: 201, 
    description: 'Tokens refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid or missing token' })
  @ApiResponse({ status: 401, description: 'Expired or invalid token' })
  async refresh(
    @Req() request: Request, 
    @Res({ passthrough: true }) response: Response,
    @Body() refreshTokenDto?: RefreshTokenDto
  ): Promise<{ access_token: string }> {
    // First try to get the token from the cookie
    let token = request.cookies?.[AUTH_CONSTANTS.COOKIE_NAMES.REFRESH_TOKEN];
    
    // If not in the cookie, fall back to the request body for backwards compatibility
    if (!token && refreshTokenDto) {
      token = refreshTokenDto.refreshToken || refreshTokenDto.refresh_token;
    }
    
    if (!token) {
      throw new BadRequestException('A refresh token is required');
    }
    
    this.logger.debug('Processing refresh token request');
    
    // Get tokens with cookie configuration
    const authResponse = await this.authService.refreshTokenWithCookies(token);
    
    // Set the new refresh token as an HttpOnly cookie
    response.cookie(
      authResponse.cookieName,
      authResponse.refreshToken,
      authResponse.cookieOptions
    );
    
    this.logger.debug('Refresh token rotation completed');
    
    // Return only the access token in the response body
    return {
      access_token: authResponse.accessToken,
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user profile', description: 'Retrieves the profile information of the connected user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '605a1cb9d4d5d73598045618' },
        email: { type: 'string', example: 'user@example.com' },
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
        role: { type: 'string', example: 'teacher' },
        createdAt: { type: 'string', format: 'date-time', example: '2023-01-01T12:00:00Z' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Missing or invalid token' })
  getProfile(@CurrentUser() user: User) {
    return user;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get current user information', 
    description: 'Retrieves the user information associated with the bearer token in the Authorization header' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '605a1cb9d4d5d73598045618' },
        email: { type: 'string', example: 'user@example.com' },
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
        role: { type: 'string', example: 'user' },
        emailVerified: { type: 'boolean', example: true },
        createdAt: { type: 'string', format: 'date-time', example: '2023-01-01T12:00:00Z' },
        updatedAt: { type: 'string', format: 'date-time', example: '2023-01-01T12:00:00Z' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Missing or invalid token' })
  getCurrentUser(@CurrentUser() user: User) {
    this.logger.debug(`Getting current user: ${user.id}`);
    return user;
  }
} 