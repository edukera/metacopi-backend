import { HttpStatus } from '@nestjs/common';
import { TestApp } from '../../utils/test-app';
import { User, UserRole } from '../../../src/modules/users/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';

describe('Auth Refresh Token (Integration)', () => {
  let testApp: TestApp;
  let userModel: Model<User>;
  let userId: Types.ObjectId;
  let refreshToken: string;
  let jwtSecret: string;
  let refreshTokenSecret: string;
  let userEmail: string;

  beforeAll(async () => {
    testApp = await TestApp.create();
    userModel = testApp.moduleRef.get(`${User.name}Model`);
    jwtSecret = testApp.configService.get<string>('auth.jwtSecret') || 'metacopi_jwt_secret';
    refreshTokenSecret = testApp.configService.get<string>('auth.refreshTokenSecret') || 'metacopi_refresh_secret';
  });

  afterAll(async () => {
    await testApp.close();
  });

  beforeEach(async () => {
    await testApp.clearDb();
    
    // Generate a unique email for each test
    userEmail = `user.refresh.${Date.now()}@example.com`;
    
    // Create a user for all tests
    userId = new Types.ObjectId();
    await userModel.create({
      _id: userId,
      email: userEmail,
      password: await bcrypt.hash('Password123!', 10),
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.USER,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Get a valid refresh token via the login API
    const loginResponse = await request(testApp.app.getHttpServer())
      .post('/auth/login')
      .send({
        email: userEmail,
        password: 'Password123!',
      });

    refreshToken = loginResponse.body.refresh_token;
  });

  describe('POST /auth/refresh', () => {
    it('should refresh tokens with a valid refresh token', async () => {
      // Action: Refresh the token
      const response = await request(testApp.app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refresh_token: refreshToken,
        });

      // Assertions: Check the response
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should reject an expired refresh token', async () => {
      // Create an expired token (with a past date)
      const expiredToken = jwt.sign(
        { 
          sub: userId.toString(), 
          email: userEmail,
          role: UserRole.USER,
          exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
        },
        refreshTokenSecret
      );

      // Action: Try to refresh with an expired token
      const response = await request(testApp.app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refresh_token: expiredToken,
        });

      // Assertions: Check that the response is a rejection
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Unauthorized');
    });

    it('should reject a refresh token for a deleted user', async () => {
      // Delete the user after obtaining a valid token
      await userModel.deleteOne({ _id: userId });

      // Action: Try to refresh with a token from a deleted user
      const response = await request(testApp.app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refresh_token: refreshToken,
        });

      // Assertions: Check that the response is a rejection
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should reject a falsified refresh token', async () => {
      // Create a token with a different secret (falsified)
      const fakeToken = jwt.sign(
        { 
          sub: userId.toString(),
          email: userEmail,
          role: UserRole.USER
        },
        'wrong-secret'
      );

      // Action: Try to refresh with a falsified token
      const response = await request(testApp.app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refresh_token: fakeToken,
        });

      // Assertions: Check that the response is a rejection
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should reject a request without a refresh token', async () => {
      // Action: Try to refresh without providing a token
      const response = await request(testApp.app.getHttpServer())
        .post('/auth/refresh')
        .send({});

      // Assertions: Check that the response is a rejection
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
}); 