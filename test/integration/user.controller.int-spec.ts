import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, connect, Model, Types } from 'mongoose';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UserService } from '../../src/modules/users/user.service';
import { User, UserSchema, UserRole } from '../../src/modules/users/user.schema';
import { MongoUserRepository } from '../../src/modules/users/user.repository';
import { CreateUserDto } from '../../src/modules/users/user.interface';

// Increase timeout for all tests
jest.setTimeout(30000);

describe('User Service (Isolated Integration)', () => {
  let userService: UserService;
  let mongoUserRepository: MongoUserRepository;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  let userModel: Model<User>;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    console.log('Starting isolated integration tests...');
    
    // Create an in-memory MongoDB database
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoConnection = (await connect(uri)).connection;

    // Test module configuration
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([
          { name: User.name, schema: UserSchema },
        ]),
      ],
      providers: [
        MongoUserRepository,
        UserService,
      ],
    }).compile();

    // Get service instances
    userService = moduleRef.get<UserService>(UserService);
    mongoUserRepository = moduleRef.get<MongoUserRepository>(MongoUserRepository);
    userModel = mongoConnection.model(User.name, UserSchema);
    
    console.log('Setup complete');
  });

  afterAll(async () => {
    console.log('Cleaning up after tests...');
    try {
      if (moduleRef) {
        await moduleRef.close();
      }
      
      if (mongoConnection) {
        await mongoConnection.dropDatabase();
        await mongoConnection.close(true);
      }
      
      if (mongod) {
        await mongod.stop();
      }
      
      console.log('Cleanup complete');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  });

  beforeEach(async () => {
    console.log('Cleaning database...');
    await userModel.deleteMany({});
  });

  it('should create a user', async () => {
    console.log('Testing user creation...');
    
    const createUserDto: CreateUserDto = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
    };

    const user = await userService.create(createUserDto);
    
    expect(user).toBeDefined();
    expect(user.email).toBe(createUserDto.email);
    expect(user.firstName).toBe(createUserDto.firstName);
    expect(user.lastName).toBe(createUserDto.lastName);
    expect(user.id).toBeDefined();
    expect(user.role).toBe(UserRole.USER);
    
    // Verify that the user was created in the database
    const savedUser = await userModel.findById(user.id);
    expect(savedUser).toBeDefined();
    expect(savedUser.email).toBe(createUserDto.email);
    
    // Verify that the password is hashed
    expect(savedUser.password).not.toBe(createUserDto.password);
    const isPasswordValid = await bcrypt.compare(createUserDto.password, savedUser.password);
    expect(isPasswordValid).toBe(true);
    
    console.log('Test completed successfully');
  });

  it('should find a user by email', async () => {
    console.log('Testing user search by email...');
    
    const email = 'findme@example.com';
    
    // Create a user for the test
    const createUserDto: CreateUserDto = {
      firstName: 'Find',
      lastName: 'Me',
      email: email,
      password: 'password123',
    };
    
    await userService.create(createUserDto);
    
    // Search for the user by email
    const user = await userService.findByEmail(email);
    
    expect(user).toBeDefined();
    expect(user.email).toBe(email);
    
    console.log('Test completed successfully');
  });

  it('should find all users', async () => {
    console.log('Testing search for all users...');
    
    // Create multiple users for the test
    await userService.create({
      firstName: 'User',
      lastName: 'One',
      email: 'user1@example.com',
      password: 'password123',
    });
    
    await userService.create({
      firstName: 'User',
      lastName: 'Two',
      email: 'user2@example.com',
      password: 'password123',
    });
    
    // Search for all users
    const users = await userService.findAll();
    
    expect(users).toBeDefined();
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBe(2);
    
    const emails = users.map(u => u.email);
    expect(emails).toContain('user1@example.com');
    expect(emails).toContain('user2@example.com');
    
    console.log('Test completed successfully');
  });
}); 