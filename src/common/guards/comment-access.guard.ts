import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { MembershipService } from '../../modules/memberships/membership.service';
import { TaskService } from '../../modules/tasks/task.service';
import { SubmissionService } from '../../modules/submissions/submission.service';
import { CorrectionService } from '../../modules/corrections/correction.service';
import { CommentService } from '../../modules/comments/comment.service';
import { UserRole } from '../../modules/users/user.schema';
import { MembershipRole } from '../../modules/memberships/membership.schema';

@Injectable()
export class CommentAccessGuard implements CanActivate {
  private readonly logger = new Logger(CommentAccessGuard.name);

  constructor(
    private readonly membershipService: MembershipService,
    private readonly taskService: TaskService,
    private readonly submissionService: SubmissionService,
    private readonly correctionService: CorrectionService,
    private readonly commentService: CommentService,
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
    const correctionId = request.params.id; // ID de la correction dans l'URL
    const commentId = request.params.commentId; // ID du commentaire dans l'URL
    
    this.logger.debug(`Access check: userEmail=${userEmail}, method=${method}, correctionId=${correctionId}, commentId=${commentId}`);
    
    // Cas 1: Accès à un commentaire spécifique par ID
    if (commentId) {
      // Si nous avons besoin de récupérer le commentaire pour d'autres vérifications
      const comment = await this.commentService.findOne(commentId);
      
      // Si l'utilisateur est l'auteur du commentaire
      if (comment.createdByEmail === userEmail) {
        return true;
      }
      
      // Sinon, vérifier l'accès à la correction associée
      return this.checkCorrectionAccess(userEmail, comment.correctionId, method);
    }
    
    // Cas 2: Accès à tous les commentaires d'une correction
    if (correctionId) {
      return this.checkCorrectionAccess(userEmail, correctionId, method);
    }
    
    // Si aucun identifiant n'est fourni, refuser l'accès
    throw new ForbiddenException('Missing correction or comment identifier');
  }
  
  // Vérifie l'accès à une correction spécifique
  private async checkCorrectionAccess(userEmail: string, correctionId: string, method: string): Promise<boolean> {
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
    
    throw new ForbiddenException('You do not have permission to access comments for this correction');
  }
} 