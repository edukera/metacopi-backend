import { applyDecorators, UseGuards } from '@nestjs/common';
import { RolesGuard, Roles, PermissionGuard, CheckPermission, OwnershipGuard, CheckOwnership } from '../guards';
import { UserRole } from '../../modules/users/user.schema';

// Decorator to restrict access by role
export function Auth(...roles: UserRole[]) {
  return applyDecorators(
    Roles(...roles),
    UseGuards(RolesGuard),
  );
}

// Decorator to check permissions by resource/action
export function RequirePermission(resource: string, action: string) {
  return applyDecorators(
    CheckPermission(resource, action),
    UseGuards(PermissionGuard),
  );
}

// Decorator to check permissions and resource ownership
export function RequireOwnership(resource: string, action: string, ownerField: string) {
  return applyDecorators(
    CheckPermission(resource, action),
    CheckOwnership(ownerField),
    UseGuards(PermissionGuard, OwnershipGuard),
  );
}

// Commonly used business decorators
export const AdminOnly = Auth(UserRole.ADMIN);
export const AuthenticatedUser = Auth(UserRole.USER, UserRole.ADMIN); 
