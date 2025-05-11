import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { MembershipService } from '../../modules/memberships/membership.service';
import { TaskService } from '../../modules/tasks/task.service';
import { SubmissionService } from '../../modules/submissions/submission.service';
import { CorrectionService } from '../../modules/corrections/correction.service';
import { AIAnnotationService } from '../../modules/ai-annotations/ai-annotation.service';
import { UserRole } from '../../modules/users/user.schema';
import { MembershipRole } from '../../modules/memberships/membership.schema';

@Injectable()
export class AIAnnotationAccessGuard implements CanActivate {
  private readonly logger = new Logger(AIAnnotationAccessGuard.name);

  constructor(
    private readonly membershipService: MembershipService,
    private readonly taskService: TaskService,
    private readonly submissionService: SubmissionService,
    private readonly correctionService: CorrectionService,
    private readonly aiAnnotationService: AIAnnotationService,
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
    const aiAnnotationId = request.params.aiAnnotationId; // ID logique de l'annotation AI dans l'URL
    
    this.logger.debug(`Access check: userEmail=${userEmail}, method=${method}, correctionId=${correctionId}, aiAnnotationId=${aiAnnotationId}`);
    
    // Cas 1: Accès à une annotation AI spécifique par ID logique
    if (aiAnnotationId) {
      // Si nous avons besoin de récupérer l'annotation AI pour d'autres vérifications
      const aiAnnotation = await this.aiAnnotationService.findById(aiAnnotationId);
      
      // Si l'utilisateur est l'auteur de l'annotation AI (sauf si c'est un système IA)
      if (aiAnnotation.createdByEmail === userEmail && !aiAnnotation.createdByEmail.includes('ai-system')) {
        return true;
      }
      
      // Sinon, vérifier l'accès à la correction associée
      return this.checkCorrectionAccess(userEmail, aiAnnotation.correctionId, method);
    }
    
    // Cas 2: Accès à toutes les annotations AI d'une correction
    if (correctionId) {
      return this.checkCorrectionAccess(userEmail, correctionId, method);
    }
    
    // Si aucun identifiant n'est fourni, refuser l'accès
    throw new ForbiddenException('Missing correction or AI annotation identifier');
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
    
    throw new ForbiddenException('You do not have permission to access AI annotations for this correction');
  }
} 