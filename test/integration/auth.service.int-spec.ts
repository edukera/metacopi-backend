import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, connect, Model } from 'mongoose';
import { AuthService } from '../../src/modules/auth/auth.service';
import { UserService } from '../../src/modules/users/user.service';
import { User, UserSchema } from '../../src/modules/users/user.schema';
import { UnauthorizedException } from '@nestjs/common';
import { LoginDto } from '../../src/modules/auth/dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { MongoUserRepository } from '../../src/modules/users/user.repository';

describe('AuthService (Integration)', () => {
  let authService: AuthService;
  let userService: UserService;
  let jwtService: JwtService;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  let userModel: Model<User>;
  let moduleRef: TestingModule;
  let configService: ConfigService;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoConnection = (await connect(uri)).connection;
    userModel = mongoConnection.model(User.name, UserSchema);

    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({
            auth: {
              jwtSecret: 'test_jwt_secret',
              jwtExpiresIn: '15m',
              refreshSecret: 'test_refresh_secret',
              refreshExpiresIn: '7d',
              refreshTokenSecret: 'test_refresh_secret',
            }
          })]
        }),
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: async (configService: ConfigService) => ({
            secret: configService.get<string>('auth.jwtSecret'),
            signOptions: { 
              expiresIn: configService.get<string>('auth.jwtExpiresIn'),
            },
          }),
        }),
      ],
      providers: [
        AuthService,
        UserService,
        MongoUserRepository,
      ],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
    userService = moduleRef.get<UserService>(UserService);
    jwtService = moduleRef.get<JwtService>(JwtService);
    configService = moduleRef.get<ConfigService>(ConfigService);
  });

  afterAll(async () => {
    try {
      if (moduleRef) {
        await moduleRef.close();
      }
      
      if (mongoConnection) {
        // Delete all collections before closing
        const collections = mongoConnection.collections;
        for (const key in collections) {
          const collection = collections[key];
          await collection.deleteMany({});
        }
        
        // Properly close the connection
        await mongoConnection.dropDatabase();
        await mongoConnection.close(true);
      }
      
      if (mongod) {
        await mongod.stop();
      }
      
      // Force cleanup of timers and other objects
      jest.clearAllTimers();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    } catch (error) {
      console.error('Error during resource cleanup:', error);
    }
  }, 10000); // Increase timeout to ensure proper closure

  beforeEach(async () => {
    const collections = mongoConnection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  describe('validateUser', () => {
    it('should validate user with correct credentials', async () => {
      // Create a test user
      const password = 'testPassword123';
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await userModel.create({
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        emailVerified: true,
      });

      const result = await authService.validateUser('test@example.com', password);

      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
      expect(result.firstName).toBe('Test');
      expect(result.lastName).toBe('User');
      expect(result.role).toBe('user');
      expect(result.emailVerified).toBe(true);
      expect((result as any).password).toBeUndefined();
    });

    it('should return null for invalid credentials', async () => {
      const password = 'testPassword123';
      const hashedPassword = await bcrypt.hash(password, 10);
      await userModel.create({
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        emailVerified: true,
      });

      const result = await authService.validateUser('test@example.com', 'wrongPassword');
      expect(result).toBeNull();
    });

    it('should return null for non-existent user', async () => {
      const result = await authService.validateUser('nonexistent@example.com', 'anyPassword');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should generate tokens for valid credentials', async () => {
      // Create a test user
      const password = 'testPassword123';
      const hashedPassword = await bcrypt.hash(password, 10);
      await userModel.create({
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        emailVerified: true,
      });

      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'testPassword123',
      };

      const result = await authService.login(loginDto);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();

      // Verify that the tokens are valid
      const decodedAccess = jwtService.verify(result.accessToken);
      const decodedRefresh = jwtService.verify(result.refreshToken, {
        secret: configService.get<string>('auth.refreshTokenSecret'),
      });

      expect(decodedAccess.email).toBe('test@example.com');
      expect(decodedAccess.role).toBe('user');
      expect(decodedRefresh.email).toBe('test@example.com');
      expect(decodedRefresh.role).toBe('user');
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongPassword',
      };

      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    // Store timer references for cleanup
    let timeoutRef: NodeJS.Timeout;
    
    afterEach(() => {
      // Cancel potential timers
      if (timeoutRef) {
        clearTimeout(timeoutRef);
      }
    });
    
    it('should generate new tokens with valid refresh token', async () => {
      // Create a user and generate initial tokens
      const password = 'testPassword123';
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await userModel.create({
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        emailVerified: true,
      });

      const initialTokens = await authService.login({
        email: 'test@example.com',
        password: 'testPassword123',
      });

      // Wait 1 second to ensure that JWT timestamps will be different
      // Store the timer reference for cleanup
      await new Promise(resolve => {
        timeoutRef = setTimeout(resolve, 1000);
      });

      const result = await authService.refreshToken(initialTokens.refreshToken);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.accessToken).not.toBe(initialTokens.accessToken);
      expect(result.refreshToken).not.toBe(initialTokens.refreshToken);

      // Verify that the new tokens are valid
      const decodedAccess = jwtService.verify(result.accessToken);
      const decodedRefresh = jwtService.verify(result.refreshToken, {
        secret: configService.get<string>('auth.refreshTokenSecret'),
      });

      expect(decodedAccess.sub).toBe(user.id);
      expect(decodedAccess.email).toBe('test@example.com');
      expect(decodedRefresh.sub).toBe(user.id);
      expect(decodedRefresh.email).toBe('test@example.com');
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      await expect(authService.refreshToken('invalid_token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user no longer exists', async () => {
      // Create a user and generate a token
      const password = 'testPassword123';
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await userModel.create({
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        emailVerified: true,
      });

      const tokens = await authService.login({
        email: 'test@example.com',
        password: 'testPassword123',
      });

      // Delete the user
      await userModel.findByIdAndDelete(user.id);

      // Try to refresh the token
      await expect(authService.refreshToken(tokens.refreshToken)).rejects.toThrow(UnauthorizedException);
    });
  });
}); 