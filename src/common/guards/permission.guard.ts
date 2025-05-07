import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../modules/users/user.schema';

// Definition of resources and actions allowed by role
const PERMISSIONS = {
  [UserRole.ADMIN]: {
    'User': ['create', 'read', 'update', 'delete', 'list'],
    'Class': ['create', 'read', 'update', 'delete', 'list', 'archive', 'regenerateCode'],
    'Task': ['create', 'read', 'update', 'delete', 'list', 'publish', 'archive'],
    'Submission': ['create', 'read', 'update', 'delete', 'list'],
    'Correction': ['create', 'read', 'update', 'delete', 'list'],
    'Membership': ['create', 'read', 'update', 'delete', 'list'],
    'AuditLog': ['read', 'list'],
  },
  [UserRole.USER]: {
    'User': ['read'],
    'Class': ['create', 'read', 'join', 'list', 'update', 'delete', 'archive', 'regenerateCode'],
    'Task': ['read'],
    'Membership': ['read', 'create'],
    'Submission': [], // Empty by default, will be defined based on Membership context
    'Correction': [], // Empty by default, will be defined based on Membership context
    'AuditLog': [],
  },
};

// Decorator to check permissions
export const RESOURCE_KEY = 'resource';
export const ACTION_KEY = 'action';

export const CheckPermission = (resource: string, action: string) => {
  return (target: any, key: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(RESOURCE_KEY, resource, descriptor.value);
    Reflect.defineMetadata(ACTION_KEY, action, descriptor.value);
    return descriptor;
  };
};

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const { user, params, body } = request;
    
    if (!user) {
      return false; // Not authenticated
    }
    
    const resource = this.reflector.get<string>(
      RESOURCE_KEY,
      context.getHandler(),
    );
    
    const action = this.reflector.get<string>(
      ACTION_KEY,
      context.getHandler(),
    );
    
    if (!resource || !action) {
      return true; // No specific restrictions
    }
    
    // If admin, has all rights
    if (user.role === UserRole.ADMIN) {
      return true;
    }
    
    // For normal users, check basic permissions
    const userPermissions = PERMISSIONS[user.role] || {};
    const allowedActions = userPermissions[resource] || [];
    
    if (!allowedActions.includes(action)) {
      // Some actions are allowed based on Membership context
      // This logic would be implemented here with the help of a MembershipService
      
      // For example, for tasks in a class where the user is a teacher:
      /*
      if (resource === 'Task' && action === 'create') {
        const classId = params.classId || body.classId;
        if (classId && await this.membershipService.isTeacher(user.id, classId)) {
          return true;
        }
      }
      */
      
      throw new ForbiddenException(`You don't have permission to perform this action`);
    }
    
    return true;
  }
} 