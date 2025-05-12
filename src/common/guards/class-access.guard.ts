import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { MembershipService } from '../../modules/memberships/membership.service';
import { UserRole } from '../../modules/users/user.schema';
import { MembershipRole } from '../../modules/memberships/membership.schema';

@Injectable()
export class ClassAccessGuard implements CanActivate {
  private readonly logger = new Logger(ClassAccessGuard.name);

  constructor(
    private readonly membershipService: MembershipService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const method = request.method;
    
    // If no authenticated user, deny access
    if (!user) {
      throw new ForbiddenException('User is not authenticated');
    }
    
    const userEmail = user.email;
    
    // If admin, grant access
    if (user.role === UserRole.ADMIN) {
      return true;
    }
    
    // Extract relevant parameters - Now primarily using 'classId'
    const classId = request.params.classId || request.query.classId || request.body?.classId;
    
    if (!classId) {
      throw new ForbiddenException('Class ID is required');
    }
    
    this.logger.debug(`Class access check: userEmail=${userEmail}, method=${method}, classId=${classId}`);
    
    // For all cases involving a class, check if the user is a teacher of this class
    return this.checkTeacherAccess(userEmail, classId);
  }
  
  // Check if the user is a teacher of the class
  private async checkTeacherAccess(userEmail: string, classId: string): Promise<boolean> {
    const isTeacher = await this.membershipService.checkMembershipRole(userEmail, classId, MembershipRole.TEACHER);
    
    if (isTeacher) {
      return true;
    }
    
    throw new ForbiddenException('You must be a teacher of this class to access this resource');
  }
} 