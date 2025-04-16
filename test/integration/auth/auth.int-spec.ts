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

  beforeAll(async () => {
    testApp = await TestApp.create();
    userModel = testApp.moduleRef.get(`${User.name}Model`);
  });

  afterAll(async () => {
    await testApp.close();
  });

  beforeEach(async () => {
    await testApp.clearDb();
  });

  describe('POST /auth/login', () => {
    it('should authenticate a user with valid credentials', async () => {
      // Arrangement: Create a user for testing
      const password = 'Password123!';
      const hashedPassword = await bcrypt.hash(password, 10);
      const email = `user.login.${Date.now()}@example.com`;
      
      const user = await userModel.create({
        _id: new Types.ObjectId(),
        email,
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.USER,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

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
      
      await userModel.create({
        _id: new Types.ObjectId(),
        email,
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.USER,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

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
      
      const user = await userModel.create({
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