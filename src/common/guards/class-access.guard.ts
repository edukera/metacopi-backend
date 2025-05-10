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
    
    // Si pas d'utilisateur authentifié, refuser l'accès
    if (!user) {
      throw new ForbiddenException('User is not authenticated');
    }
    
    const userEmail = user.email;
    
    // Si admin, autoriser l'accès
    if (user.role === UserRole.ADMIN) {
      return true;
    }
    
    // Extraire les paramètres pertinents
    const classId = request.params.classId || request.query.classId || request.body?.classId;
    
    if (!classId) {
      throw new ForbiddenException('Class ID is required');
    }
    
    this.logger.debug(`Class access check: userEmail=${userEmail}, method=${method}, classId=${classId}`);
    
    // Pour tous les cas impliquant une classe, vérifier si l'utilisateur est enseignant de cette classe
    return this.checkTeacherAccess(userEmail, classId);
  }
  
  // Vérifie si l'utilisateur est enseignant de la classe
  private async checkTeacherAccess(userEmail: string, classId: string): Promise<boolean> {
    const isTeacher = await this.membershipService.checkMembershipRole(userEmail, classId, MembershipRole.TEACHER);
    
    if (isTeacher) {
      return true;
    }
    
    throw new ForbiddenException('You must be a teacher of this class to access this resource');
  }
} 