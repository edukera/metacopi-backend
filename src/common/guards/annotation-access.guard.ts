import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { MembershipService } from '../../modules/memberships/membership.service';
import { TaskService } from '../../modules/tasks/task.service';
import { SubmissionService } from '../../modules/submissions/submission.service';
import { CorrectionService } from '../../modules/corrections/correction.service';
import { AnnotationService } from '../../modules/annotations/annotation.service';
import { UserRole } from '../../modules/users/user.schema';
import { MembershipRole } from '../../modules/memberships/membership.schema';

@Injectable()
export class AnnotationAccessGuard implements CanActivate {
  private readonly logger = new Logger(AnnotationAccessGuard.name);

  constructor(
    private readonly membershipService: MembershipService,
    private readonly taskService: TaskService,
    private readonly submissionService: SubmissionService,
    private readonly correctionService: CorrectionService,
    private readonly annotationService: AnnotationService,
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
    const correctionId = request.params.correctionId; // ID logique de la correction dans l'URL
    const annotationId = request.params.annotationId; // ID logique de l'annotation dans l'URL
    
    this.logger.debug(`Access check: userEmail=${userEmail}, method=${method}, correctionId=${correctionId}, annotationId=${annotationId}`);
    
    // Cas 1: Accès à une annotation spécifique par ID logique
    if (annotationId) {
      // Si nous avons besoin de récupérer l'annotation pour d'autres vérifications
      const annotation = await this.annotationService.findById(annotationId);
      
      // Si l'utilisateur est l'auteur de l'annotation
      if (annotation.createdByEmail === userEmail) {
        return true;
      }
      
      // Sinon, vérifier l'accès à la correction associée
      return this.checkCorrectionAccess(userEmail, annotation.correctionId, method);
    }
    
    // Cas 2: Accès à toutes les annotations d'une correction
    if (correctionId) {
      return this.checkCorrectionAccess(userEmail, correctionId, method);
    }
    
    // Si aucun identifiant n'est fourni, refuser l'accès
    throw new ForbiddenException('Missing correction or annotation identifier');
  }
  
  // Vérifie l'accès à une correction spécifique
  private async checkCorrectionAccess(userEmail: string, correctionId: string, method: string): Promise<boolean> {
    // Rechercher la correction par ID logique
    const correction = await this.correctionService.findOne(correctionId);
    
    // 1. Si l'utilisateur est l'auteur de la correction
    if (correction.correctedByEmail === userEmail) {
      return true;
    }
    
    // 2. Si l'utilisateur est enseignant de la classe associée
    const submission = await this.submissionService.findOne(correction.submissionId);
    const task = await this.taskService.findOne(submission.taskId);
    const isTeacher = await this.membershipService.checkMembershipRole(userEmail, task.classId, MembershipRole.TEACHER);
    
    if (isTeacher) {
      return true;
    }
    
    // 3. Si l'utilisateur est l'étudiant concerné par la correction (GET uniquement)
    if (method === 'GET' && submission.studentEmail === userEmail) {
      return true;
    }
    
    throw new ForbiddenException('You do not have permission to access annotations for this correction');
  }
} 