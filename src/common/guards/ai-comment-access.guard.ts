import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { MembershipService } from '../../modules/memberships/membership.service';
import { TaskService } from '../../modules/tasks/task.service';
import { SubmissionService } from '../../modules/submissions/submission.service';
import { CorrectionService } from '../../modules/corrections/correction.service';
import { AICommentService } from '../../modules/ai-comments/ai-comment.service';
import { UserRole } from '../../modules/users/user.schema';
import { MembershipRole } from '../../modules/memberships/membership.schema';

@Injectable()
export class AICommentAccessGuard implements CanActivate {
  private readonly logger = new Logger(AICommentAccessGuard.name);

  constructor(
    private readonly membershipService: MembershipService,
    private readonly taskService: TaskService,
    private readonly submissionService: SubmissionService,
    private readonly correctionService: CorrectionService,
    private readonly aiCommentService: AICommentService,
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
    const aiCommentId = request.params.aiCommentId; // ID logique du commentaire AI dans l'URL
    
    this.logger.debug(`Access check: userEmail=${userEmail}, method=${method}, correctionId=${correctionId}, aiCommentId=${aiCommentId}`);
    
    // Cas 1: Accès à un commentaire AI spécifique par ID logique
    if (aiCommentId) {
      // Si nous avons besoin de récupérer le commentaire AI pour d'autres vérifications
      const aiComment = await this.aiCommentService.findOne(aiCommentId);
      
      // Si l'utilisateur est l'auteur du commentaire AI
      if (aiComment.createdByEmail === userEmail) {
        return true;
      }
      
      // Sinon, vérifier l'accès à la correction associée
      return this.checkCorrectionAccess(userEmail, aiComment.correctionId, method);
    }
    
    // Cas 2: Accès à tous les commentaires AI d'une correction
    if (correctionId) {
      return this.checkCorrectionAccess(userEmail, correctionId, method);
    }
    
    // Si aucun identifiant n'est fourni, refuser l'accès
    throw new ForbiddenException('Missing correction or AI comment identifier');
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
    
    throw new ForbiddenException('You do not have permission to access AI comments for this correction');
  }
} 