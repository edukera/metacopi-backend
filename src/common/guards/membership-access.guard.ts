import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { MembershipService } from '../../modules/memberships/membership.service';
import { UserRole } from '../../modules/users/user.schema';
import { MembershipRole } from '../../modules/memberships/membership.schema';

@Injectable()
export class MembershipAccessGuard implements CanActivate {
  private readonly logger = new Logger(MembershipAccessGuard.name);

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
    const membershipId = request.params.id;
    const classId = request.params.classId || request.query.classId || request.body?.classId;
    const targetUserEmail = request.params.email || request.query.email || request.body?.email;
    
    this.logger.debug(`Membership access check: userEmail=${userEmail}, method=${method}, membershipId=${membershipId}, classId=${classId}, targetUserEmail=${targetUserEmail}`);
    
    // Cas 1: Accès à un membership spécifique par ID
    if (membershipId) {
      return this.checkMembershipAccess(userEmail, membershipId, method);
    }
    
    // Cas 2: Liste des memberships filtrés par classe
    if (classId) {
      return this.checkClassAccess(userEmail, classId, method);
    }
    
    // Cas 3: Liste des memberships filtrés par utilisateur
    if (targetUserEmail) {
      return this.checkUserAccess(userEmail, targetUserEmail, method);
    }
    
    // Cas 4: Pour les enseignants, limiter aux classes où ils enseignent
    if (method === 'GET') {
      request.userAccessFilter = { email: userEmail };
      return true;
    }
    
    // Pour les autres cas, continuer avec la validation standard
    return true;
  }
  
  // Vérifie l'accès à un membership spécifique
  private async checkMembershipAccess(userEmail: string, membershipId: string, method: string): Promise<boolean> {
    const membership = await this.membershipService.findOne(membershipId);
    
    if (!membership) {
      throw new ForbiddenException(`Membership with ID ${membershipId} not found`);
    }
    
    // 1. Si l'utilisateur est l'utilisateur concerné par le membership
    if (membership.email === userEmail) {
      // L'utilisateur peut voir son propre membership mais pas le modifier/supprimer
      if (method === 'GET') {
        return true;
      }
    }
    
    // 2. Si l'utilisateur est enseignant de la classe associée
    const isTeacher = await this.membershipService.checkMembershipRole(userEmail, membership.classId, MembershipRole.TEACHER);
    
    if (isTeacher) {
      return true;
    }
    
    throw new ForbiddenException('You do not have permission to access this membership');
  }
  
  // Vérifie l'accès aux memberships d'une classe
  private async checkClassAccess(userEmail: string, classId: string, method: string): Promise<boolean> {
    // Vérifier si l'utilisateur est enseignant de cette classe
    const isTeacher = await this.membershipService.checkMembershipRole(userEmail, classId, MembershipRole.TEACHER);
    
    if (isTeacher) {
      return true;
    }
    
    // Si c'est un GET et que l'utilisateur est membre de la classe, il peut voir les autres membres
    if (method === 'GET') {
      const isMember = await this.membershipService.findByUserAndClass(userEmail, classId);
      if (isMember) {
        return true;
      }
    }
    
    throw new ForbiddenException('You do not have permission to access memberships for this class');
  }
  
  // Vérifie l'accès aux memberships d'un utilisateur
  private async checkUserAccess(userEmail: string, targetUserEmail: string, method: string): Promise<boolean> {
    // 1. Si l'utilisateur veut voir ses propres memberships
    if (userEmail === targetUserEmail) {
      return true;
    }
    
    // 2. Pour les enseignants, vérifier s'ils ont un étudiant avec ce targetUserEmail
    const teacherMemberships = await this.membershipService.findByUserEmail(userEmail);
    const teacherClassIds = teacherMemberships
      .filter(m => m.role === MembershipRole.TEACHER)
      .map(m => m.classId);
    
    // Vérifier si l'utilisateur cible est membre d'une des classes où l'utilisateur est enseignant
    for (const classId of teacherClassIds) {
      const targetMembership = await this.membershipService.findByUserAndClass(targetUserEmail, classId);
      if (targetMembership) {
        return true;
      }
    }
    
    throw new ForbiddenException('You do not have permission to access memberships for this user');
  }
} 