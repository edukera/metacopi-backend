import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UserService } from '../users/user.service';
import { User } from '../users/user.interface';
import { UserRole } from '../users/user.schema';
import { UnauthorizedException } from '@nestjs/common';
import { AUTH_CONSTANTS } from './auth.constants';

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUser: User = {
    id: 'user-id',
    email: 'test@example.com',
    password: 'hashed-password',
    firstName: 'John',
    lastName: 'Doe',
    avatarUrl: 'https://example.com/avatar.png',
    emailVerified: true,
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockUserWithoutPassword = { ...mockUser };
  delete mockUserWithoutPassword.password;

  const tokenPayload = {
    sub: mockUser.id,
    email: mockUser.email,
    role: mockUser.role
  };

  const mockCookieOptions = {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 604800000, // 7 days
    path: '/auth',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findByEmail: jest.fn(),
            comparePasswords: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              if (key === 'environment') return 'development';
              if (key === 'auth.refreshTokenExpiresIn') return '7d';
              return 'mock-value';
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should validate a user and return user without password', async () => {
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(userService, 'comparePasswords').mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');
      expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(userService.comparePasswords).toHaveBeenCalledWith('password', mockUser.password);
      expect(result).toEqual(mockUserWithoutPassword);
    });

    it('should return null when user is not found', async () => {
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password');
      expect(userService.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(userService, 'comparePasswords').mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrong-password');
      expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(userService.comparePasswords).toHaveBeenCalledWith('wrong-password', mockUser.password);
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should generate authentication tokens', async () => {
      const tokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };
      jest.spyOn(service as any, 'generateTokens').mockReturnValue(tokens);

      const result = await service.login(mockUserWithoutPassword);
      expect(result).toEqual(tokens);
      expect((service as any).generateTokens).toHaveBeenCalledWith(mockUserWithoutPassword);
    });
  });

  describe('loginWithCookies', () => {
    it('should generate tokens with cookie configuration', async () => {
      const tokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };
      jest.spyOn(service, 'login').mockResolvedValue(tokens);

      const result = await service.loginWithCookies(mockUserWithoutPassword);
      
      expect(service.login).toHaveBeenCalledWith(mockUserWithoutPassword);
      expect(result).toEqual({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        cookieName: AUTH_CONSTANTS.COOKIE_NAMES.REFRESH_TOKEN,
        cookieOptions: expect.objectContaining({
          httpOnly: true,
          path: '/auth',
        }),
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const tokens = { accessToken: 'new-access-token', refreshToken: 'new-refresh-token' };
      jest.spyOn(jwtService, 'verify').mockReturnValue(tokenPayload);
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(service as any, 'generateTokens').mockReturnValue(tokens);

      const result = await service.refreshToken('valid-refresh-token');
      expect(result).toEqual(tokens);
      expect(jwtService.verify).toHaveBeenCalledWith('valid-refresh-token', expect.any(Object));
      expect(userService.findByEmail).toHaveBeenCalledWith(tokenPayload.email);
      expect((service as any).generateTokens).toHaveBeenCalledWith(mockUser);
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue(tokenPayload);
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(null);

      await expect(service.refreshToken('valid-token-nonexistent-user')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshTokenWithCookies', () => {
    it('should refresh tokens with cookie configuration', async () => {
      const tokens = { accessToken: 'new-access-token', refreshToken: 'new-refresh-token' };
      jest.spyOn(service, 'refreshToken').mockResolvedValue(tokens);

      const result = await service.refreshTokenWithCookies('valid-refresh-token');
      
      expect(service.refreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(result).toEqual({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        cookieName: AUTH_CONSTANTS.COOKIE_NAMES.REFRESH_TOKEN,
        cookieOptions: expect.objectContaining({
          httpOnly: true,
          path: '/auth',
        }),
      });
    });
  });
}); 