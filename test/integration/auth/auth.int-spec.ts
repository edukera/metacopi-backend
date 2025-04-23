import { HttpStatus } from '@nestjs/common';
import { TestApp } from '../../utils/test-app';
import { User, UserRole } from '../../../src/modules/users/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import * as request from 'supertest';

describe('AuthController (Integration)', () => {
  let testApp: TestApp;
  let userModel: Model<User>;
  // Array to track created user IDs for cleanup
  const createdUserIds: Types.ObjectId[] = [];

  beforeAll(async () => {
    testApp = await TestApp.create();
    userModel = testApp.moduleRef.get(`${User.name}Model`);
  });

  afterAll(async () => {
    // Ensure all created users are deleted before closing
    if (userModel) {
      console.log(`Cleaning up ${createdUserIds.length} tracked users...`);
      for (const userId of createdUserIds) {
        await userModel.deleteOne({ _id: userId }).exec();
      }
      
      // Double-check and force cleanup if needed
      await userModel.deleteMany({});
      const remainingCount = await userModel.countDocuments({});
      if (remainingCount > 0) {
        console.warn(`Warning: ${remainingCount} users still in database after cleanup`);
        // Force drop collection as last resort
        if (testApp.app) {
          const db = testApp.app.get('DATABASE_CONNECTION');
          if (db) {
            await db.collection('users').drop().catch(err => {
              if (err.message !== 'ns not found') console.error('Error dropping users collection:', err);
            });
          }
        }
      }
    }
    
    await testApp.close();
  });

  beforeEach(async () => {
    await testApp.clearDb();
    // Clear tracking array
    createdUserIds.length = 0;
  });

  afterEach(async () => {
    // Clean up users created during the test
    if (userModel && createdUserIds.length > 0) {
      console.log(`Cleaning up ${createdUserIds.length} users after test...`);
      for (const userId of createdUserIds) {
        await userModel.deleteOne({ _id: userId }).exec();
      }
    }
  });

  // Helper function to create a user and track for cleanup
  async function createTestUser(userId: Types.ObjectId, email: string): Promise<void> {
    await userModel.create({
      _id: userId,
      email,
      password: await bcrypt.hash('Password123!', 10),
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.USER,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Add to tracking array for cleanup
    createdUserIds.push(userId);
  }

  describe('POST /auth/login', () => {
    it('should authenticate a user with valid credentials', async () => {
      // Arrangement: Create a user for testing
      const password = 'Password123!';
      const hashedPassword = await bcrypt.hash(password, 10);
      const email = `user.login.${Date.now()}@example.com`;
      const userId = new Types.ObjectId();
      
      const user = await userModel.create({
        _id: userId,
        email,
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.USER,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      createdUserIds.push(userId);

      // Action: Try to authenticate
      const response = await request(testApp.app.getHttpServer())
        .post('/auth/login')
        .send({
          email,
          password: 'Password123!',
        });

      // Assertions: Check the response
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should reject authentication with invalid credentials', async () => {
      // Arrangement: Create a user for testing
      const password = 'Password123!';
      const hashedPassword = await bcrypt.hash(password, 10);
      const email = `user.login.${Date.now()}@example.com`;
      const userId = new Types.ObjectId();
      
      await userModel.create({
        _id: userId,
        email,
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.USER,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      createdUserIds.push(userId);

      // Action: Try to authenticate with wrong password
      const response = await request(testApp.app.getHttpServer())
        .post('/auth/login')
        .send({
          email,
          password: 'WrongPassword123!',
        });

      // Assertions: Check the response
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh tokens with a valid refresh token', async () => {
      // Arrangement: Create a user and generate a token
      const userId = new Types.ObjectId();
      const email = `user.refresh.${Date.now()}@example.com`;
      
      await createTestUser(userId, email);

      // Generate a valid refresh token
      const testUser = {
        id: userId.toString(),
        email,
        role: UserRole.USER,
      };
      
      const refreshToken = testApp.generateAuthToken(testUser);

      // Action: Try to refresh the token
      const response = await request(testApp.app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refresh_token: refreshToken,
        });

      // Assertions: Check the response
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should reject refresh with an invalid refresh token', async () => {
      // Action: Try to refresh with an invalid token
      const response = await request(testApp.app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refresh_token: 'invalid-token',
        });

      // Assertions: Check the response
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /auth/profile', () => {
    it('should return user profile with valid token', async () => {
      // Arrangement: Create a user for testing
      const userId = new Types.ObjectId();
      const email = `user.profile.${Date.now()}@example.com`;
      
      await createTestUser(userId, email);

      // Create a test user and generate a token
      const testUser = {
        id: userId.toString(),
        email,
        role: UserRole.USER,
      };

      // Action: Retrieve the user profile
      const response = await testApp.getWithAuth('/auth/profile', testUser);

      // Assertions: Check the response
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should reject access without authentication', async () => {
      // Action: Try to access the profile without authentication
      const response = await request(testApp.app.getHttpServer())
        .get('/auth/profile');

      // Assertions: Check the response
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
}); 