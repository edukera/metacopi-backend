import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogService } from '../../modules/audit-logs/audit-log.service';
import { TargetType } from '../../modules/audit-logs/audit-log.schema';
import { Request } from 'express';

export interface AuditLogData {
  action: string;
  targetType: TargetType;
  targetId?: string;
  metadata?: Record<string, any>;
}

export function AuditLog(data: AuditLogData) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    Reflect.defineMetadata('auditLogData', data, descriptor.value);
    return descriptor;
  };
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(private auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const handler = context.getHandler();
    const auditLogData: AuditLogData = Reflect.getMetadata('auditLogData', handler);

    if (!auditLogData) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    // Use the user ID stored in JWT by NestJS
    const userId = request.user ? (request.user as Record<string, any>).sub : null;

    // Determining the targetId:
    // 1. Use the one provided in metadata (if present)
    // 2. Look in route parameters (ex: /tasks/123)
    // 3. Look in the request body (ex: creation)
    let targetId = auditLogData.targetId;
    
    if (!targetId) {
      // Check route parameters
      const params = request.params;
      if (params.id) {
        targetId = params.id;
      } else if (params[`${auditLogData.targetType.toLowerCase()}Id`]) {
        targetId = params[`${auditLogData.targetType.toLowerCase()}Id`];
      }
      // Check body for creations
      else if (request.method === 'POST' && request.body && request.body.id) {
        targetId = request.body.id;
      }
    }

    const metadata = {
      ...auditLogData.metadata,
      method: request.method,
      url: request.url,
      ip: request.ip,
    };

    return next.handle().pipe(
      tap(async (data) => {
        // For creations, we can get the ID from the result
        if (!targetId && data && data._id) {
          targetId = data._id.toString();
        }

        if (targetId) {
          try {
            await this.auditLogService.create({
              userId,
              action: auditLogData.action,
              targetType: auditLogData.targetType,
              targetId,
              metadata,
            });
          } catch (error) {
            this.logger.error('Error creating audit log:', error);
          }
        }
      }),
    );
  }
} 