import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../users/user.service';
import { User } from '../users/user.interface';
import { TokenPayload, AuthTokens, LoginDto, AuthResponseWithCookies } from './dto/auth.dto';
import { AUTH_CONSTANTS } from './auth.constants';
import { getRefreshTokenCookieConfig } from '../../common/middlewares/cookie-config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  // Simple list of logged out user emails
  private invalidatedUserEmails: Set<string> = new Set();

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<Omit<User, 'password'> | null> {
    this.logger.debug(`Attempting to validate user with email: ${email}`);
    const user = await this.userService.findByEmail(email);
    
    if (!user) {
      this.logger.debug(`User with email ${email} not found`);
      return null;
    }
    
    this.logger.debug(`User found, comparing passwords`);
    const isPasswordValid = await this.userService.comparePasswords(password, user.password);
    this.logger.debug(`Password comparison result: ${isPasswordValid}`);
    
    if (isPasswordValid) {
      const { password, ...result } = user as any;
      return result;
    }
    
    return null;
  }

  async login(loginDto: LoginDto | Omit<User, 'password'>): Promise<AuthTokens> {
    // If it's a LoginDto, first validate the user
    if ('password' in loginDto) {
      const user = await this.validateUser(loginDto.email, loginDto.password);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
      
      // If user was in the logged out list, remove them
      if (this.invalidatedUserEmails.has(user.email)) {
        this.invalidatedUserEmails.delete(user.email);
        this.logger.debug(`User ${user.email} reconnected, removing from invalidated list`);
      }
      
      return this.generateTokens(user);
    }
    
    // If user was in the logged out list, remove them
    const user = loginDto as any;
    if (this.invalidatedUserEmails.has(user.email)) {
      this.invalidatedUserEmails.delete(user.email);
      this.logger.debug(`User ${user.email} reconnected, removing from invalidated list`);
    }
    
    // If it's already a validated user, directly generate tokens
    return this.generateTokens(loginDto);
  }

  /**
   * Login with cookie-based refresh token
   * @param loginDto Login credentials
   * @returns Access token and refresh token with cookie configuration
   */
  async loginWithCookies(loginDto: LoginDto | Omit<User, 'password'>): Promise<AuthResponseWithCookies> {
    const tokens = await this.login(loginDto);
    
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      cookieName: AUTH_CONSTANTS.COOKIE_NAMES.REFRESH_TOKEN,
      cookieOptions: getRefreshTokenCookieConfig(this.configService),
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify the refresh token
      const payload = this.jwtService.verify<TokenPayload>(
        refreshToken,
        {
          secret: this.configService.get<string>('auth.refreshTokenSecret') || 'default_refresh_secret',
        }
      );
      
      // Check if user is logged out
      if (this.invalidatedUserEmails.has(payload.email)) {
        throw new UnauthorizedException('User has been logged out');
      }
      
      // Get the corresponding user
      const user = await this.userService.findByEmail(payload.email);
      
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      
      // Generate new tokens
      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Refresh token with cookie-based refresh token
   * @param refreshToken The refresh token string
   * @returns Access token and refresh token with cookie configuration
   */
  async refreshTokenWithCookies(refreshToken: string): Promise<AuthResponseWithCookies> {
    const tokens = await this.refreshToken(refreshToken);
    
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      cookieName: AUTH_CONSTANTS.COOKIE_NAMES.REFRESH_TOKEN,
      cookieOptions: getRefreshTokenCookieConfig(this.configService),
    };
  }

  /**
   * Logs out a user by adding their email to the list of logged out users.
   * For a more robust implementation in production, use Redis or another caching solution.
   * 
   * @param email Email of the user to log out
   */
  async invalidateUserTokens(email: string): Promise<void> {
    this.logger.debug(`Invalidating tokens for user: ${email}`);
    this.invalidatedUserEmails.add(email);
    this.logger.debug(`User ${email} added to invalidated list`);
  }

  private generateTokens(user: Omit<User, 'password'>): AuthTokens {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    
    return {
      accessToken: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('auth.jwtSecret') || 'default_jwt_secret',
        expiresIn: this.configService.get<string>('auth.jwtExpiresIn') || '15m',
      }),
      refreshToken: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('auth.refreshTokenSecret') || 'default_refresh_secret',
        expiresIn: this.configService.get<string>('auth.refreshTokenExpiresIn') || '7d',
      }),
    };
  }
} 