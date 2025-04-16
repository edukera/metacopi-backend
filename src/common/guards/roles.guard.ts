import { Injectable, CanActivate, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../modules/users/user.schema';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>(
      ROLES_KEY,
      context.getHandler(),
    );
    
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No role restrictions
    }
    
    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      return false; // User not authenticated
    }
    
    return requiredRoles.some(role => user.role === role);
  }
} 