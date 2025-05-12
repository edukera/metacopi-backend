import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class UserAccessGuard implements CanActivate {
  private readonly logger = new Logger(UserAccessGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const targetEmail = request.params.email;

    // If user is not authenticated, deny access
    if (!user) {
      this.logger.warn('Access attempt without authentication');
      return false;
    }

    // If user is admin, allow full access
    if (user.role === 'ADMIN') {
      this.logger.log(`Access granted to administrator (${user.email}) for user ${targetEmail}`);
      return true;
    }

    // A user can only access their own data
    if (user.email === targetEmail) {
      this.logger.log(`Access granted to user for their own data: ${targetEmail}`);
      return true;
    }

    this.logger.warn(`Access denied: user ${user.email} attempted to access data for ${targetEmail}`);
    throw new ForbiddenException(`You cannot access another user's data`);
  }
} 