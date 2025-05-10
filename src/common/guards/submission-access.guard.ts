import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { MembershipService } from '../../modules/memberships/membership.service';
import { TaskService } from '../../modules/tasks/task.service';
import { SubmissionService } from '../../modules/submissions/submission.service';
import { UserRole } from '../../modules/users/user.schema';
import { MembershipRole } from '../../modules/memberships/membership.schema';
import { Logger } from '@nestjs/common';

@Injectable()
export class SubmissionAccessGuard implements CanActivate {
  private readonly logger = new Logger(SubmissionAccessGuard.name);

  constructor(
    private readonly membershipService: MembershipService,
    private readonly taskService: TaskService,
    private readonly submissionService: SubmissionService,
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
    const submissionId = request.params.id;
    const taskId = request.query.taskId || request.params.taskId || request.body?.taskId;
    const classId = request.query.classId || request.params.classId || request.body?.classId;
    
    this.logger.debug(`Access check: userEmail=${userEmail}, method=${method}, submissionId=${submissionId}, taskId=${taskId}, classId=${classId}`);
    
    // Cas 1: Accès à une soumission spécifique par ID
    if (submissionId) {
      return this.checkSubmissionAccess(userEmail, submissionId, method);
    }
    
    // Cas 2: Liste des soumissions filtrées par tâche
    if (taskId) {
      return this.checkTaskAccess(userEmail, taskId, method);
    }
    
    // Cas 3: Liste des soumissions filtrées par classe
    if (classId) {
      return this.checkClassAccess(userEmail, classId, method);
    }
    
    // Cas 4: Pour les méthodes GET sans filtre, limiter aux soumissions de l'utilisateur
    if (method === 'GET') {
      // On va ajouter un filtre sur le service pour ne retourner que les soumissions
      // de l'utilisateur ou des classes où il est enseignant
      request.userAccessFilter = { email: userEmail };
      return true;
    }
    
    // Pour les autres cas (comme la création), on continue avec la validation standard
    return true;
  }
  
  // Vérifie l'accès à une soumission spécifique
  private async checkSubmissionAccess(userEmail: string, submissionId: string, method: string): Promise<boolean> {
    const submission = await this.submissionService.findOne(submissionId);
    
    // 1. Si l'utilisateur est l'auteur de la soumission
    if (submission.studentEmail === userEmail) {
      // L'auteur peut voir mais pas modifier/supprimer
      if (method === 'GET') {
        return true;
      }
    }
    
    // 2. Si l'utilisateur est enseignant de la classe associée à la tâche
    const task = await this.taskService.findOne(submission.taskId);
    const isTeacher = await this.membershipService.checkMembershipRole(userEmail, task.classId, MembershipRole.TEACHER);
    
    if (isTeacher) {
      return true;
    }
    
    throw new ForbiddenException('You do not have permission to access this submission');
  }
  
  // Vérifie l'accès aux soumissions d'une tâche
  private async checkTaskAccess(userEmail: string, taskId: string, method: string): Promise<boolean> {
    // 1. Obtenir la classe associée à la tâche
    const task = await this.taskService.findOne(taskId);
    
    // 2. Vérifier si l'utilisateur est enseignant de cette classe
    const isTeacher = await this.membershipService.checkMembershipRole(userEmail, task.classId, MembershipRole.TEACHER);
    
    if (isTeacher) {
      return true;
    }
    
    // 3. Pour les GET, les étudiants peuvent voir leurs propres soumissions
    if (method === 'GET') {
      // Ajouter un filtre pour ne retourner que les propres soumissions de l'étudiant
      // lors de l'exécution du service
      return true;
    }
    
    throw new ForbiddenException('You do not have permission to access submissions for this task');
  }
  
  // Vérifie l'accès aux soumissions d'une classe
  private async checkClassAccess(userEmail: string, classId: string, method: string): Promise<boolean> {
    // Vérifier si l'utilisateur est enseignant de cette classe
    const isTeacher = await this.membershipService.checkMembershipRole(userEmail, classId, MembershipRole.TEACHER);
    
    if (isTeacher) {
      return true;
    }
    
    throw new ForbiddenException('You do not have permission to access submissions for this class');
  }
} 