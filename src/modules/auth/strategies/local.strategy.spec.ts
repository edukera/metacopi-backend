import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { LocalStrategy } from './local.strategy';
import { AuthService } from '../auth.service';
import { User } from '../../users/user.interface';
import { UserRole } from '../../users/user.schema';

describe('LocalStrategy', () => {
  let localStrategy: LocalStrategy;
  let authService: AuthService;

  const mockUser: Omit<User, 'password'> = {
    id: 'user-id-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.USER,
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAuthService = {
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    localStrategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return user object when credentials are valid', async () => {
      // Arrange
      mockAuthService.validateUser.mockResolvedValue(mockUser);
      
      // Act
      const result = await localStrategy.validate('test@example.com', 'password123');
      
      // Assert
      expect(authService.validateUser).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      // Arrange
      mockAuthService.validateUser.mockResolvedValue(null);
      
      // Act & Assert
      await expect(localStrategy.validate('test@example.com', 'wrong_password'))
        .rejects.toThrow(UnauthorizedException);
      
      expect(authService.validateUser).toHaveBeenCalledWith('test@example.com', 'wrong_password');
    });
  });
}); 