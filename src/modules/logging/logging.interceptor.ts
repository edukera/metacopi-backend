import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, path, body, query, params, ip, headers } = request;
    const requestId = uuidv4();
    const userAgent = headers['user-agent'] || 'unknown';
    const userId = request.user?.['id'] || 'anonymous';

    // Add a unique identifier to the request
    request['requestId'] = requestId;
    response.setHeader('X-Request-ID', requestId);

    // Start timestamp
    const now = Date.now();

    // Log incoming request
    this.logger.log({
      message: `Incoming request ${method} ${path}`,
      requestId,
      method,
      path,
      userId,
      userAgent,
      ip,
      body: this.sanitizeBody(body),
      query,
      params,
    });

    return next.handle().pipe(
      tap({
        next: (data: any) => {
          // Log outgoing response
          const responseTime = Date.now() - now;
          this.logger.log({
            message: `Outgoing response ${method} ${path} ${response.statusCode}`,
            requestId,
            statusCode: response.statusCode,
            responseTime: `${responseTime}ms`,
            responseSize: this.getResponseSize(data),
          });
        },
        error: (error: any) => {
          // Log error
          const responseTime = Date.now() - now;
          this.logger.error({
            message: `Error ${method} ${path} ${error.status || 500}`,
            requestId,
            statusCode: error.status || 500,
            errorName: error.name,
            errorMessage: error.message,
            responseTime: `${responseTime}ms`,
            stack: error.stack,
          });
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;

    // Create a deep copy of the body to avoid modifying the original
    const sanitized = JSON.parse(JSON.stringify(body));

    // Mask sensitive fields
    const sensitiveFields = ['password', 'token', 'refreshToken', 'secret', 'apiKey'];
    
    const maskObject = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      
      Object.keys(obj).forEach(key => {
        if (sensitiveFields.includes(key.toLowerCase())) {
          obj[key] = '***MASKED***';
        } else if (typeof obj[key] === 'object') {
          maskObject(obj[key]);
        }
      });
    };

    maskObject(sanitized);
    return sanitized;
  }

  private getResponseSize(data: any): string {
    if (!data) return '0B';
    
    try {
      const size = Buffer.from(JSON.stringify(data)).length;
      if (size < 1024) return `${size}B`;
      if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)}KB`;
      return `${(size / (1024 * 1024)).toFixed(2)}MB`;
    } catch (error) {
      return 'unknown';
    }
  }
} 