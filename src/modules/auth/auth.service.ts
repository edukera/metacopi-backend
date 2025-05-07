import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../users/user.service';
import { User } from '../users/user.interface';
import { TokenPayload, AuthTokens, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  // Simple list of logged out user IDs
  private invalidatedUserIds: Set<string> = new Set();

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
      if (this.invalidatedUserIds.has(user.id)) {
        this.invalidatedUserIds.delete(user.id);
        this.logger.debug(`User ${user.id} reconnected, removing from invalidated list`);
      }
      
      return this.generateTokens(user);
    }
    
    // If user was in the logged out list, remove them
    const user = loginDto as any;
    if (this.invalidatedUserIds.has(user.id)) {
      this.invalidatedUserIds.delete(user.id);
      this.logger.debug(`User ${user.id} reconnected, removing from invalidated list`);
    }
    
    // If it's already a validated user, directly generate tokens
    return this.generateTokens(loginDto);
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
      if (this.invalidatedUserIds.has(payload.sub)) {
        throw new UnauthorizedException('User has been logged out');
      }
      
      // Get the corresponding user
      const user = await this.userService.findById(payload.sub);
      
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
   * Logs out a user by adding their ID to the list of logged out users.
   * For a more robust implementation in production, use Redis or another caching solution.
   * 
   * @param userId ID of the user to log out
   */
  async invalidateUserTokens(userId: string): Promise<void> {
    this.logger.debug(`Invalidating tokens for user: ${userId}`);
    this.invalidatedUserIds.add(userId);
    this.logger.debug(`User ${userId} added to invalidated list`);
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