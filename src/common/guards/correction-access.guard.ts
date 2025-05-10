import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { MembershipService } from '../../modules/memberships/membership.service';
import { TaskService } from '../../modules/tasks/task.service';
import { SubmissionService } from '../../modules/submissions/submission.service';
import { CorrectionService } from '../../modules/corrections/correction.service';
import { UserRole } from '../../modules/users/user.schema';
import { MembershipRole } from '../../modules/memberships/membership.schema';
import { Logger } from '@nestjs/common';

@Injectable()
export class CorrectionAccessGuard implements CanActivate {
  private readonly logger = new Logger(CorrectionAccessGuard.name);

  constructor(
    private readonly membershipService: MembershipService,
    private readonly taskService: TaskService,
    private readonly submissionService: SubmissionService,
    private readonly correctionService: CorrectionService,
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
    const correctionId = request.params.id;
    const submissionId = request.params.submissionId;
    const teacherId = request.params.teacherId;
    
    this.logger.debug(`Access check: userEmail=${userEmail}, method=${method}, correctionId=${correctionId}, submissionId=${submissionId}, teacherId=${teacherId}`);
    
    // Si l'utilisateur est l'enseignant référencé, autoriser l'accès
    if (teacherId && teacherId === userEmail) {
      return true;
    }
    
    // Cas 1: Accès à une correction spécifique par ID
    if (correctionId) {
      return this.checkCorrectionAccess(userEmail, correctionId, method);
    }
    
    // Cas 2: Accès à une correction via l'ID de soumission
    if (submissionId) {
      return this.checkSubmissionAccess(userEmail, submissionId, method);
    }
    
    // Pour les autres cas, on vérifie uniquement si l'utilisateur est un enseignant
    request.userAccessFilter = { userEmail };
    return true;
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
    
    throw new ForbiddenException('You do not have permission to access this correction');
  }
  
  // Vérifie l'accès à une correction via l'ID de soumission
  private async checkSubmissionAccess(userEmail: string, submissionId: string, method: string): Promise<boolean> {
    const submission = await this.submissionService.findOne(submissionId);
    
    // Si l'utilisateur est l'étudiant concerné (GET uniquement)
    if (method === 'GET' && submission.studentEmail === userEmail) {
      return true;
    }
    
    // Si l'utilisateur est enseignant de la classe associée
    const task = await this.taskService.findOne(submission.taskId);
    const isTeacher = await this.membershipService.checkMembershipRole(userEmail, task.classId, MembershipRole.TEACHER);
    
    if (isTeacher) {
      return true;
    }
    
    throw new ForbiddenException('You do not have permission to access corrections for this submission');
  }
} 