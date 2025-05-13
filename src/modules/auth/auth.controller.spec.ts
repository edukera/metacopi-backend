import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '../users/user.interface';
import { LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserRole } from '../users/user.schema';
import { BadRequestException } from '@nestjs/common';
import { AUTH_CONSTANTS } from './auth.constants';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  // Mock user
  const mockUser: User = {
    id: 'userId123',
    email: 'test@example.com',
    password: 'hashedPassword',
    firstName: 'John',
    lastName: 'Doe',
    avatarUrl: null,
    role: UserRole.USER,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Omit password from mockUserWithoutPassword
  const mockUserWithoutPassword = { ...mockUser };
  delete mockUserWithoutPassword.password;

  // Mock tokens
  const mockTokens = {
    accessToken: 'mockAccessToken',
    refreshToken: 'mockRefreshToken',
  };

  // Mock cookie response
  const mockCookieTokens = {
    accessToken: 'mockAccessToken',
    refreshToken: 'mockRefreshToken',
    cookieName: AUTH_CONSTANTS.COOKIE_NAMES.REFRESH_TOKEN,
    cookieOptions: {
      httpOnly: true,
      secure: false,
      sameSite: 'lax' as const,
      maxAge: 604800000, // 7 days in ms
      path: '/auth',
    },
  };

  // Mock response object
  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  };

  // Mock request object
  const mockRequest = {
    cookies: {
      [AUTH_CONSTANTS.COOKIE_NAMES.REFRESH_TOKEN]: 'mockCookieRefreshToken',
    },
  };

  // Mock auth service
  const mockAuthService = {
    login: jest.fn().mockResolvedValue(mockTokens),
    loginWithCookies: jest.fn().mockResolvedValue(mockCookieTokens),
    refreshToken: jest.fn().mockResolvedValue(mockTokens),
    refreshTokenWithCookies: jest.fn().mockResolvedValue(mockCookieTokens),
    validateUser: jest.fn().mockResolvedValue(mockUserWithoutPassword),
    invalidateUserTokens: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should set refresh token cookie and return access token and user on successful login', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Reset mocks
      jest.spyOn(authService, 'validateUser').mockResolvedValueOnce(mockUserWithoutPassword);
      jest.spyOn(authService, 'loginWithCookies').mockResolvedValueOnce(mockCookieTokens);

      const result = await controller.login(loginDto, mockResponse as any);

      expect(authService.validateUser).toHaveBeenCalledWith(loginDto.email, loginDto.password);
      expect(authService.loginWithCookies).toHaveBeenCalledWith(loginDto);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        mockCookieTokens.cookieName,
        mockCookieTokens.refreshToken,
        mockCookieTokens.cookieOptions
      );
      expect(result).toEqual({
        access_token: mockCookieTokens.accessToken,
        user: mockUserWithoutPassword,
      });
    });

    it('should throw BadRequestException when user validation fails', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      jest.spyOn(authService, 'validateUser').mockResolvedValueOnce(null);

      await expect(controller.login(loginDto, mockResponse as any)).rejects.toThrow(BadRequestException);
      expect(mockResponse.cookie).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should clear refresh token cookie and invalidate user tokens', async () => {
      const result = await controller.logout(mockUser, mockResponse as any);

      expect(authService.invalidateUserTokens).toHaveBeenCalledWith(mockUser.id);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(AUTH_CONSTANTS.COOKIE_NAMES.REFRESH_TOKEN);
      expect(result).toEqual({ message: 'Logout successful' });
    });
  });

  describe('refresh', () => {
    it('should extract refresh token from cookies and return new access token', async () => {
      const result = await controller.refresh(mockRequest as any, mockResponse as any);

      expect(authService.refreshTokenWithCookies).toHaveBeenCalledWith('mockCookieRefreshToken');
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        mockCookieTokens.cookieName,
        mockCookieTokens.refreshToken,
        mockCookieTokens.cookieOptions
      );
      expect(result).toEqual({
        access_token: mockCookieTokens.accessToken,
      });
    });

    it('should fall back to body for refresh token if cookie is not present', async () => {
      const requestWithoutCookie = { cookies: {} };
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'bodyRefreshToken',
      };

      const result = await controller.refresh(requestWithoutCookie as any, mockResponse as any, refreshTokenDto);

      expect(authService.refreshTokenWithCookies).toHaveBeenCalledWith('bodyRefreshToken');
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        mockCookieTokens.cookieName,
        mockCookieTokens.refreshToken,
        mockCookieTokens.cookieOptions
      );
      expect(result).toEqual({
        access_token: mockCookieTokens.accessToken,
      });
    });

    it('should throw BadRequestException when no refresh token is provided', async () => {
      const requestWithoutCookie = { cookies: {} };
      
      await expect(controller.refresh(requestWithoutCookie as any, mockResponse as any)).rejects.toThrow(BadRequestException);
      expect(mockResponse.cookie).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should return the user profile', async () => {
      const result = controller.getProfile(mockUser);
      expect(result).toEqual(mockUser);
    });
  });
}); 