import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import { setupMongoDB, closeMongoDB, clearDatabase } from '../mongodb-memory-server';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../../src/modules/users/user.schema';
import { HttpExceptionFilter } from '../../src/modules/logging/http-exception.filter';

export interface TestUser {
  id: string;
  email: string;
  role: UserRole;
}

// Create a mock for HttpExceptionFilter
class MockHttpExceptionFilter {
  private logger = {
    error: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
  };
  
  catch(exception: any, host: any) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception.getStatus ? exception.getStatus() : 500;
    
    response.status(status).json({
      statusCode: status,
      message: exception.message || 'Internal server error',
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}

export class TestApp {
  app: INestApplication;
  moduleRef: TestingModule;
  jwtService: JwtService;
  configService: ConfigService;

  constructor(app: INestApplication, moduleRef: TestingModule) {
    this.app = app;
    this.moduleRef = moduleRef;
    this.jwtService = this.moduleRef.get<JwtService>(JwtService);
    this.configService = this.moduleRef.get<ConfigService>(ConfigService);
  }

  /**
   * Creates an application instance for testing
   */
  static async create(): Promise<TestApp> {
    // Increase Jest timeout for integration tests
    jest.setTimeout(30000);
    
    await setupMongoDB();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(HttpExceptionFilter)
    .useClass(MockHttpExceptionFilter)
    .compile();

    const app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    // Override the global exception filter
    app.useGlobalFilters(new MockHttpExceptionFilter());

    await app.init();

    return new TestApp(app, moduleRef);
  }

  /**
   * Clears the database
   */
  async clearDb(): Promise<void> {
    await clearDatabase();
  }

  /**
   * Closes the application and database connection
   */
  async close(): Promise<void> {
    await this.app.close();
    await closeMongoDB();
  }

  /**
   * Generates a JWT token for a test user
   */
  generateAuthToken(user: TestUser): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('auth.refreshTokenSecret') || 'metacopi_refresh_secret',
      expiresIn: '1d',
    });
  }

  /**
   * Makes an HTTP request with authentication
   */
  requestWithAuth(method: string, url: string, user: TestUser, data?: any): request.Test {
    const token = this.generateAuthToken(user);
    const req = request(this.app.getHttpServer())[method](url)
      .set('Authorization', `Bearer ${token}`);
    
    if (data) {
      return req.send(data);
    }
    
    return req;
  }

  /**
   * Makes an HTTP GET request with authentication
   */
  getWithAuth(url: string, user: TestUser): request.Test {
    return this.requestWithAuth('get', url, user);
  }

  /**
   * Makes an HTTP POST request with authentication
   */
  postWithAuth(url: string, user: TestUser, data: any): request.Test {
    return this.requestWithAuth('post', url, user, data);
  }

  /**
   * Makes an HTTP PUT request with authentication
   */
  putWithAuth(url: string, user: TestUser, data: any): request.Test {
    return this.requestWithAuth('put', url, user, data);
  }

  /**
   * Makes an HTTP DELETE request with authentication
   */
  deleteWithAuth(url: string, user: TestUser): request.Test {
    return this.requestWithAuth('delete', url, user);
  }

  /**
   * Makes an HTTP PATCH request with authentication
   */
  patchWithAuth(url: string, user: TestUser, data: any): request.Test {
    return this.requestWithAuth('patch', url, user, data);
  }
} 