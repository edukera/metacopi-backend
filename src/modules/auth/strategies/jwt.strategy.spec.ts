import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { UserService } from '../../users/user.service';
import { User } from '../../users/user.interface';
import { UserRole } from '../../users/user.schema';
import { TokenPayload } from '../dto/auth.dto';

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;
  let userService: UserService;

  const mockUser: User = {
    id: 'user-id-1',
    email: 'test@example.com',
    password: 'hashed_password',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.USER,
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserWithoutPassword = {
    id: 'user-id-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.USER,
    emailVerified: false,
    createdAt: mockUser.createdAt,
    updatedAt: mockUser.updatedAt,
  };

  const mockUserService = {
    findById: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
    userService = module.get<UserService>(UserService);

    // Configuration du ConfigService pour le test
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'auth.jwtSecret') return 'test-jwt-secret';
      return null;
    });

    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return user without password when token payload is valid', async () => {
      // Arrange
      const payload: TokenPayload = {
        sub: 'user-id-1',
        email: 'test@example.com',
        role: 'user',
      };
      mockUserService.findById.mockResolvedValue(mockUser);
      
      // Act
      const result = await jwtStrategy.validate(payload);
      
      // Assert
      expect(userService.findById).toHaveBeenCalledWith('user-id-1');
      expect(result).toEqual(mockUserWithoutPassword);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      // Arrange
      const payload: TokenPayload = {
        sub: 'non-existent-id',
        email: 'test@example.com',
        role: 'user',
      };
      mockUserService.findById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(jwtStrategy.validate(payload))
        .rejects.toThrow(UnauthorizedException);
      
      expect(userService.findById).toHaveBeenCalledWith('non-existent-id');
    });
  });
}); 