import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '../users/user.interface';
import { LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserRole } from '../users/user.schema';
import { BadRequestException } from '@nestjs/common';

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

  // Mock auth service
  const mockAuthService = {
    login: jest.fn().mockResolvedValue(mockTokens),
    refreshToken: jest.fn().mockResolvedValue(mockTokens),
    validateUser: jest.fn().mockResolvedValue({
      id: 'userId123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      avatarUrl: null,
      role: UserRole.USER,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }),
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
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return access token, refresh token and user on successful login', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Reset mocks
      jest.spyOn(authService, 'validateUser').mockResolvedValueOnce(mockUserWithoutPassword);
      jest.spyOn(authService, 'login').mockResolvedValueOnce(mockTokens);

      const result = await controller.login(loginDto);

      expect(authService.validateUser).toHaveBeenCalledWith(loginDto.email, loginDto.password);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual({
        access_token: mockTokens.accessToken,
        refresh_token: mockTokens.refreshToken,
        user: mockUserWithoutPassword,
      });
    });
  });

  describe('refresh', () => {
    it('should return new tokens on successful refresh', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'validRefreshToken',
        refresh_token: undefined,
      };

      const result = await controller.refresh(refreshTokenDto);

      expect(authService.refreshToken).toHaveBeenCalledWith('validRefreshToken');
      expect(result).toEqual({
        access_token: mockTokens.accessToken,
        refresh_token: mockTokens.refreshToken,
      });
    });

    it('should throw BadRequestException when no refresh token is provided', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: undefined,
        refresh_token: undefined,
      };

      await expect(controller.refresh(refreshTokenDto)).rejects.toThrow(BadRequestException);
    });

    it('should use refresh_token if refreshToken is not provided', async () => {
      const refreshTokenDto = {
        refresh_token: 'validRefreshToken',
        refreshToken: undefined,
      };

      jest.spyOn(authService, 'refreshToken').mockResolvedValueOnce(mockTokens);

      const result = await controller.refresh(refreshTokenDto as RefreshTokenDto);

      expect(authService.refreshToken).toHaveBeenCalledWith('validRefreshToken');
      expect(result).toEqual({
        access_token: mockTokens.accessToken,
        refresh_token: mockTokens.refreshToken,
      });
    });
  });

  describe('getProfile', () => {
    it('should return the user profile', async () => {
      const result = controller.getProfile(mockUser);
      expect(result).toEqual(mockUser);
    });
  });
}); 