import { Controller, Post, UseGuards, Body, Get, UsePipes, ValidationPipe, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, AuthTokens } from './dto/auth.dto';
import { User } from '../users/user.interface';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: 'User login', description: 'Authenticates a user and returns JWT tokens' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        refresh_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
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
  async login(@Body() loginDto: LoginDto): Promise<{
    access_token: string;
    refresh_token: string;
    user: Partial<User>;
  }> {
    // Get the user to include in the response
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }
    
    const tokens = await this.authService.login(loginDto);
    
    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user: user,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Refresh tokens', description: 'Generates new tokens from a refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Tokens refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        refresh_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid or missing token' })
  @ApiResponse({ status: 401, description: 'Expired or invalid token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<{
    access_token: string;
    refresh_token: string;
  }> {
    // The API supports both camelCase (refreshToken) and snake_case (refresh_token) formats
    // for maximum compatibility with different client implementations and the OAuth2 standard.
    // If both are provided, refreshToken takes precedence due to the OR operator order.
    const token = refreshTokenDto.refreshToken || refreshTokenDto.refresh_token;
    
    if (!token) {
      throw new BadRequestException('A refresh token is required');
    }
    
    const tokens = await this.authService.refreshToken(token);
    
    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
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
} 