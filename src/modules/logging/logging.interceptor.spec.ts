import { Test, TestingModule } from '@nestjs/testing';
import { LoggingInterceptor } from './logging.interceptor';
import { ExecutionContext, Logger, CallHandler } from '@nestjs/common';
import { createMock } from '@golevelup/ts-jest';
import { of, throwError } from 'rxjs';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let loggerSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggingInterceptor],
    }).compile();

    interceptor = module.get<LoggingInterceptor>(LoggingInterceptor);
    
    // Spy on the Logger's log method
    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    // Also spy on error for error tests
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    it('should log request and successful response', (done) => {
      // Mock for execution context with HTTP request
      const mockRequest = {
        method: 'GET',
        path: '/test',
        body: { test: 'data' },
        query: { filter: 'active' },
        params: { id: '123' },
        ip: '127.0.0.1',
        headers: {
          'user-agent': 'test-agent',
        },
        user: {
          id: 'user-123',
        },
      };
      
      const mockResponse = {
        statusCode: 200,
        setHeader: jest.fn(),
      };

      const executionContext = createMock<ExecutionContext>({
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
      });

      // Mock for call handler that returns a successful response
      const responseData = { result: 'success' };
      const callHandler = createMock<CallHandler>({
        handle: () => of(responseData),
      });

      // Call the interceptor
      interceptor.intercept(executionContext, callHandler).subscribe({
        next: (data) => {
          // Verify that the data is passed through without modification
          expect(data).toEqual(responseData);
          
          // Verify that a request ID was generated and set
          expect(mockRequest['requestId']).toBeDefined();
          expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Request-ID', mockRequest['requestId']);
          
          // Verify that the incoming request was logged
          expect(loggerSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              message: `Incoming request GET /test`,
              requestId: mockRequest['requestId'],
              method: 'GET',
              path: '/test',
              userId: 'user-123',
              body: { test: 'data' },
            }),
          );
          
          // Verify that the outgoing response was logged
          expect(loggerSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              message: `Outgoing response GET /test 200`,
              requestId: mockRequest['requestId'],
              statusCode: 200,
              responseSize: expect.any(String),
            }),
          );
          
          done();
        },
        error: (error) => done(error),
      });
    });

    it('should log request and error response', (done) => {
      // Mock for execution context with HTTP request
      const mockRequest = {
        method: 'POST',
        path: '/test',
        body: { test: 'data' },
        ip: '127.0.0.1',
        headers: {},
        user: null,
      };
      
      const mockResponse = {
        statusCode: 500,
        setHeader: jest.fn(),
      };

      const executionContext = createMock<ExecutionContext>({
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
      });

      // Mock for an error
      const testError = new Error('Test error');
      testError['status'] = 500;
      
      // Mock for call handler that returns an error
      const callHandler = createMock<CallHandler>({
        handle: () => throwError(() => testError),
      });

      // Spy on the Logger's error method
      const errorSpy = jest.spyOn(Logger.prototype, 'error');

      // Call the interceptor
      interceptor.intercept(executionContext, callHandler).subscribe({
        next: () => done(new Error('Expected error but got success')),
        error: (error) => {
          // Verify that the error is passed through without modification
          expect(error).toBe(testError);
          
          // Verify that the incoming request was logged
          expect(loggerSpy).toHaveBeenCalled();
          
          // Verify that the error was logged
          expect(errorSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              message: `Error POST /test 500`,
              requestId: mockRequest['requestId'],
              statusCode: 500,
              errorName: 'Error',
              errorMessage: 'Test error',
            }),
          );
          
          done();
        },
      });
    });

    it('should sanitize sensitive fields in request body', (done) => {
      // Mock with sensitive fields
      const mockRequest = {
        method: 'POST',
        path: '/auth/login',
        body: {
          email: 'test@example.com',
          password: 'secret123',
          nestedObj: {
            token: 'sensitive-token',
            safeField: 'safe-value',
          },
        },
        headers: {},
        ip: '127.0.0.1',
        user: null,
      };
      
      const mockResponse = {
        statusCode: 200,
        setHeader: jest.fn(),
      };

      const executionContext = createMock<ExecutionContext>({
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
      });

      // Mock for call handler
      const callHandler = createMock<CallHandler>({
        handle: () => of({ token: 'response-token' }),
      });

      // Call the interceptor
      interceptor.intercept(executionContext, callHandler).subscribe({
        next: () => {
          // Verify that the request was logged with sensitive fields masked
          expect(loggerSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              body: expect.objectContaining({
                email: 'test@example.com',
                password: '***MASKED***',
                nestedObj: expect.objectContaining({
                  token: '***MASKED***',
                  safeField: 'safe-value',
                }),
              }),
            }),
          );
          
          done();
        },
        error: (error) => done(error),
      });
    });
  });

  describe('utility methods', () => {
    it('should calculate correct response size', () => {
      // Access private method via any
      const interceptorAny = interceptor as any;
      
      expect(interceptorAny.getResponseSize(null)).toBe('0B');
      expect(interceptorAny.getResponseSize({ small: 'object' })).toMatch(/^\d+B$/);
      
      // Create a larger object for testing KB
      const largeObject = { data: 'a'.repeat(2000) };
      expect(interceptorAny.getResponseSize(largeObject)).toMatch(/^\d+\.\d+KB$/);
    });
  });
}); 