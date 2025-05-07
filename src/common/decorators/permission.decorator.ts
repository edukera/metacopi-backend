import { applyDecorators, UseGuards, SetMetadata } from '@nestjs/common';
import { RolesGuard, Roles, PermissionGuard, CheckPermission, OwnershipGuard, CheckOwnership } from '../guards';
import { UserRole } from '../../modules/users/user.schema';
import { ACTION_KEY, RESOURCE_KEY } from '../guards/permission.guard';

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

// Just set the resource and action metadata without attaching any guard
// This can be used with custom guards like SubmissionAccessGuard
export function SetPermission(resource: string, action: string) {
  return applyDecorators(
    SetMetadata(RESOURCE_KEY, resource),
    SetMetadata(ACTION_KEY, action),
  );
}

// Commonly used business decorators
export const AdminOnly = Auth(UserRole.ADMIN);
export const AuthenticatedUser = Auth(UserRole.USER, UserRole.ADMIN); 
