import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../modules/users/user.schema';

export const OWNERSHIP_KEY = 'ownership';
export const OWNER_FIELD_KEY = 'ownerField';

export const CheckOwnership = (ownerField: string) => {
  return (target: any, key: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(OWNERSHIP_KEY, true, descriptor.value);
    Reflect.defineMetadata(OWNER_FIELD_KEY, ownerField, descriptor.value);
    return descriptor;
  };
};

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    // Injection of other services if necessary to get the entity
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const checkOwnership = this.reflector.get<boolean>(
      OWNERSHIP_KEY,
      context.getHandler(),
    );
    
    if (!checkOwnership) {
      return true; // No ownership check required
    }
    
    const ownerField = this.reflector.get<string>(
      OWNER_FIELD_KEY,
      context.getHandler(),
    );
    
    if (!ownerField) {
      return true; // No owner field specified
    }
    
    const request = context.switchToHttp().getRequest();
    const { user, params } = request;
    
    if (!user) {
      return false; // Not authenticated
    }
    
    // Administrators bypass ownership verification
    if (user.role === UserRole.ADMIN) {
      return true;
    }
    
    const resourceId = params.id; // ID of the requested resource
    if (!resourceId) {
      return true; // No specific resource ID
    }
    
    // Here, you would make a request to retrieve the resource
    // and check if the user is the owner
    // Here's a conceptual example:
    
    /* 
    const resource = await this.yourService.findById(resourceId);
    if (!resource) {
      throw new NotFoundException('Resource not found');
    }
    
    // Check if user is the owner
    const isOwner = resource[ownerField] === user.id;
    
    // Teachers can access class resources they belong to
    const isTeacherWithAccess = 
      user.role === UserRole.TEACHER && 
      await this.membershipService.isTeacherOfClass(user.id, resource.classId);
    
    if (!isOwner && !isTeacherWithAccess) {
      throw new ForbiddenException('You do not have access to this resource');
    }
    */
    
    // For testing, we allow access
    return true;
  }
} 