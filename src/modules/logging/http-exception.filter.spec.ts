import { Test, TestingModule } from '@nestjs/testing';
import { HttpExceptionFilter } from './http-exception.filter';
import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import { AuditLogService } from '../audit-logs/audit-log.service';
import { ConfigService } from '@nestjs/config';
import { createMock } from '@golevelup/ts-jest';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let auditLogService: jest.Mocked<AuditLogService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HttpExceptionFilter,
        {
          provide: AuditLogService,
          useValue: {
            create: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'NODE_ENV') return 'development';
              return null;
            }),
          },
        },
      ],
    }).compile();

    filter = module.get<HttpExceptionFilter>(HttpExceptionFilter);
    auditLogService = module.get(AuditLogService) as jest.Mocked<AuditLogService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('catch', () => {
    it('should format HttpException correctly', async () => {
      // Mock ArgumentsHost
      const mockRequest = {
        url: '/test',
        method: 'GET',
        user: { id: 'test-user-id' },
        requestId: 'test-request-id',
      };
      
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockHttpContext = {
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      };

      const mockArgumentsHost = createMock<ArgumentsHost>({
        switchToHttp: jest.fn().mockReturnValue(mockHttpContext),
      });

      // Create exception
      const httpException = new HttpException(
        {
          message: 'Test error message',
          errorCode: 'TEST_ERROR',
          errorDetails: { test: 'details' },
        },
        HttpStatus.BAD_REQUEST,
      );

      // Call catch method
      await filter.catch(httpException, mockArgumentsHost);

      // Verify response format
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: 'TEST_ERROR',
          message: 'Test error message',
          path: '/test',
          requestId: 'test-request-id',
          details: { test: 'details' },
        }),
      );
    });

    it('should format standard Error correctly', async () => {
      // Mock ArgumentsHost
      const mockRequest = {
        url: '/test',
        method: 'GET',
        user: { id: 'test-user-id' },
        requestId: 'test-request-id',
      };
      
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockHttpContext = {
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      };

      const mockArgumentsHost = createMock<ArgumentsHost>({
        switchToHttp: jest.fn().mockReturnValue(mockHttpContext),
      });

      // Create exception
      const error = new Error('Standard error');
      error.stack = 'Test stack trace';

      // Call catch method
      await filter.catch(error, mockArgumentsHost);

      // Verify response format
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          errorCode: 'INTERNAL_ERROR',
          message: 'Standard error',
          path: '/test',
          requestId: 'test-request-id',
          details: { stack: 'Test stack trace' },
        }),
      );
    });

    it('should log to audit service for 5xx errors', async () => {
      // Mock ArgumentsHost
      const mockRequest = {
        url: '/test',
        method: 'GET',
        user: { id: 'test-user-id' },
        requestId: 'test-request-id',
      };
      
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockHttpContext = {
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      };

      const mockArgumentsHost = createMock<ArgumentsHost>({
        switchToHttp: jest.fn().mockReturnValue(mockHttpContext),
      });

      // Create exception
      const httpException = new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      // Call catch method
      await filter.catch(httpException, mockArgumentsHost);

      // Verify auditLogService was called
      expect(auditLogService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'test-user-id',
          action: 'ERROR',
          targetType: expect.any(String),
          targetId: 'test-user-id',
          metadata: expect.objectContaining({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          }),
        }),
      );
    });
  });
}); 