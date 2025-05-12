import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuditLogService } from '../audit-logs/audit-log.service';
import { ConfigService } from '@nestjs/config';
import { TargetType } from '../audit-logs/audit-log.schema';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly isDevelopment: boolean;

  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly configService: ConfigService,
  ) {
    this.isDevelopment = this.configService.get('NODE_ENV') !== 'production';
  }

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = request['requestId'] || 'unknown';
    const userId = request.user ? request.user['id'] : 'anonymous';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An internal error has occurred';
    let errorCode = 'INTERNAL_ERROR';
    let errorDetails: any = null;
    let stack: string | null = null;

    // Handle HTTP exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      
      const exceptionResponse: any = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        message = exceptionResponse.message || message;
        errorCode = exceptionResponse.errorCode || this.getDefaultErrorCode(status);
        errorDetails = exceptionResponse.errorDetails || null;
      }
    } else if (exception instanceof Error) {
      // For standard JavaScript exceptions
      message = exception.message;
      stack = exception.stack;
    }
    
    // Add stack trace only in development
    if (this.isDevelopment && stack) {
      errorDetails = errorDetails || {};
      errorDetails.stack = stack;
    }

    // Log the exception
    const logData = {
      requestId,
      userId,
      statusCode: status,
      errorCode,
      errorMessage: message,
      path: request.url,
      method: request.method,
      ...(errorDetails ? { errorDetails } : {}),
      ...(stack && this.isDevelopment ? { stack } : {}),
    };

    if (status >= 500) {
      console.error(`Unhandled exception: ${message}`, logData);
      
      // Log 5xx errors to the audit service for tracking
      try {
        await this.auditLogService.create({
          userId: userId !== 'anonymous' ? userId : null,
          action: 'ERROR',
          targetType: TargetType.USER, // Associate the error with the user by default
          targetId: userId !== 'anonymous' ? userId : 'system',
          metadata: {
            requestId,
            method: request.method,
            path: request.url,
            errorCode,
            errorMessage: message,
            statusCode: status,
          },
        });
      } catch (auditError) {
        console.error(`Unable to log error to AuditLog: ${auditError.message}`);
      }
    } else {
      console.warn(`Handled exception: ${message}`, logData);
    }

    // Send formatted response
    response.status(status).json({
      statusCode: status,
      errorCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
      ...(errorDetails && this.isDevelopment ? { details: errorDetails } : {}),
    });
  }

  private getDefaultErrorCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.METHOD_NOT_ALLOWED:
        return 'METHOD_NOT_ALLOWED';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'INTERNAL_SERVER_ERROR';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'SERVICE_UNAVAILABLE';
      default:
        return 'UNKNOWN_ERROR';
    }
  }
} 