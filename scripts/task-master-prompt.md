# Prompt pour Task Master: Implémentation d'un système d'autorisation basé sur les rôles d'adhésion (membership)

## Contexte
Notre application Metacopi gère des classes, tâches et soumissions dans un contexte éducatif. Actuellement, nous avons un problème majeur: les enseignants (comme Jean Dupont) ne peuvent pas accéder aux soumissions des élèves pour les tâches des classes dont ils sont responsables. Le système d'autorisation actuel est basé uniquement sur le rôle global de l'utilisateur (USER/ADMIN) et ne prend pas en compte les rôles d'adhésion (teacher/student) dans les classes spécifiques.

## Objectif
Implémenter un système d'autorisation robuste qui vérifie les rôles d'adhésion (membership) pour autoriser l'accès aux ressources liées aux classes, notamment:
- Les enseignants doivent pouvoir accéder aux soumissions des élèves pour les tâches des classes dont ils sont responsables
- Les élèves doivent pouvoir accéder uniquement à leurs propres soumissions
- Les administrateurs conservent l'accès complet à toutes les ressources

## Points clés du problème actuel
1. Le contrôleur des soumissions (`SubmissionController`) utilise le décorateur `@AdminOnly` qui limite l'accès aux administrateurs uniquement
2. Le guard `PermissionGuard` ne vérifie que le rôle global et pas les rôles d'adhésion
3. Le token JWT ne contient que le rôle global (`"role":"user"`)
4. La logique pour vérifier si un utilisateur est enseignant d'une classe n'est pas implémentée dans les guards

## Tâches à réaliser

### 1. Créer un SubmissionAccessGuard spécifique
Créer un nouveau guard dédié aux soumissions qui vérifie les conditions d'accès:

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { MembershipService } from '../modules/memberships/membership.service';
import { TaskService } from '../modules/tasks/task.service';
import { SubmissionService } from '../modules/submissions/submission.service';
import { UserRole } from '../modules/users/user.schema';
import { MembershipRole } from '../modules/memberships/membership.schema';

@Injectable()
export class SubmissionAccessGuard implements CanActivate {
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
    
    const userId = user.sub || user.id;
    
    // Si admin, autoriser l'accès
    if (user.role === UserRole.ADMIN) {
      return true;
    }
    
    // Extraire les paramètres pertinents
    const submissionId = request.params.id;
    const taskId = request.query.taskId || request.params.taskId;
    const classId = request.query.classId || request.params.classId;
    
    // Cas 1: Accès à une soumission spécifique par ID
    if (submissionId) {
      return this.checkSubmissionAccess(userId, submissionId, method);
    }
    
    // Cas 2: Liste des soumissions filtrées par tâche
    if (taskId) {
      return this.checkTaskAccess(userId, taskId, method);
    }
    
    // Cas 3: Liste des soumissions filtrées par classe
    if (classId) {
      return this.checkClassAccess(userId, classId, method);
    }
    
    // Cas 4: Pour les méthodes GET sans filtre, limiter aux soumissions de l'utilisateur
    if (method === 'GET') {
      // On va ajouter un filtre sur le service pour ne retourner que les soumissions
      // de l'utilisateur ou des classes où il est enseignant
      request.userAccessFilter = { userId };
      return true;
    }
    
    // Pour les autres cas (comme la création), on continue avec la validation standard
    return true;
  }
  
  // Vérifie l'accès à une soumission spécifique
  private async checkSubmissionAccess(userId: string, submissionId: string, method: string): Promise<boolean> {
    const submission = await this.submissionService.findOne(submissionId);
    
    // 1. Si l'utilisateur est l'auteur de la soumission
    if (submission.studentId === userId) {
      // L'auteur peut voir mais pas modifier/supprimer
      if (method === 'GET') {
        return true;
      }
    }
    
    // 2. Si l'utilisateur est enseignant de la classe associée à la tâche
    const task = await this.taskService.findOne(submission.taskId);
    const isTeacher = await this.membershipService.checkMembershipRole(userId, task.classId, MembershipRole.TEACHER);
    
    if (isTeacher) {
      return true;
    }
    
    throw new ForbiddenException('You do not have permission to access this submission');
  }
  
  // Vérifie l'accès aux soumissions d'une tâche
  private async checkTaskAccess(userId: string, taskId: string, method: string): Promise<boolean> {
    // 1. Obtenir la classe associée à la tâche
    const task = await this.taskService.findOne(taskId);
    
    // 2. Vérifier si l'utilisateur est enseignant de cette classe
    const isTeacher = await this.membershipService.checkMembershipRole(userId, task.classId, MembershipRole.TEACHER);
    
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
  private async checkClassAccess(userId: string, classId: string, method: string): Promise<boolean> {
    // Vérifier si l'utilisateur est enseignant de cette classe
    const isTeacher = await this.membershipService.checkMembershipRole(userId, classId, MembershipRole.TEACHER);
    
    if (isTeacher) {
      return true;
    }
    
    throw new ForbiddenException('You do not have permission to access submissions for this class');
  }
}
```

### 2. Modifier le contrôleur de soumissions
Mettre à jour le contrôleur pour utiliser le nouveau guard et permettre l'accès aux enseignants:

```typescript
import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { SubmissionService } from './submission.service';
import { CreateSubmissionDto, UpdateSubmissionDto } from './submission.dto';
import { Submission } from './submission.schema';
import { AuthenticatedUser, RequirePermission } from '../../common/decorators';
import { Permission } from '../../common/permissions.enum';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SubmissionAccessGuard } from '../../common/guards/submission-access.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('submissions')
@ApiBearerAuth()
@Controller('submissions')
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new submission' })
  @ApiBody({ type: CreateSubmissionDto })
  @ApiResponse({ status: 201, description: 'The submission has been successfully created.', type: Submission })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions.' })
  @UseGuards(JwtAuthGuard)
  @RequirePermission(Permission.CREATE_SUBMISSIONS, 'create')
  async create(@Body() createSubmissionDto: CreateSubmissionDto): Promise<Submission> {
    return this.submissionService.create(createSubmissionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all submissions with optional filtering' })
  @ApiQuery({ name: 'taskId', required: false, description: 'Filter submissions by task ID' })
  @ApiQuery({ name: 'classId', required: false, description: 'Filter submissions by class ID' })
  @ApiResponse({ status: 200, description: 'List of submissions.', type: [Submission] })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions.' })
  @UseGuards(JwtAuthGuard, SubmissionAccessGuard)
  @RequirePermission(Permission.READ_SUBMISSIONS, 'list')
  async findAll(
    @Query('taskId') taskId?: string,
    @Query('classId') classId?: string,
  ): Promise<Submission[]> {
    if (taskId) {
      return this.submissionService.findByTask(taskId);
    }
    if (classId) {
      return this.submissionService.findByClass(classId);
    }
    return this.submissionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a submission by ID' })
  @ApiParam({ name: 'id', description: 'Submission ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'The found submission.', type: Submission })
  @ApiResponse({ status: 404, description: 'Submission not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions.' })
  @UseGuards(JwtAuthGuard, SubmissionAccessGuard)
  @RequirePermission(Permission.READ_SUBMISSIONS, 'read')
  async findOne(@Param('id') id: string): Promise<Submission> {
    return this.submissionService.findOne(id);
  }

  // Autres méthodes du contrôleur avec UseGuards(JwtAuthGuard, SubmissionAccessGuard)...
}
```

### 3. Ajouter les méthodes manquantes au SubmissionService
Ajouter la méthode de recherche par classe qui manque:

```typescript
async findByClass(classId: string): Promise<Submission[]> {
  // 1. Trouver toutes les tâches de cette classe
  const tasks = await this.taskModel.find({ classId }).exec();
  const taskIds = tasks.map(task => task._id.toString());
  
  // 2. Trouver toutes les soumissions pour ces tâches
  return this.submissionModel.find({
    taskId: { $in: taskIds }
  }).exec();
}
```

### 4. Implémenter les méthodes nécessaires au MembershipService
S'assurer que le MembershipService a les méthodes requises:

```typescript
async checkMembershipRole(userId: string, classId: string, role: MembershipRole): Promise<boolean> {
  const membership = await this.membershipModel.findOne({
    userId,
    classId,
    role,
    status: MembershipStatus.ACTIVE
  }).exec();
  
  return !!membership;
}

async isTeacherForTask(userId: string, taskId: string): Promise<boolean> {
  // 1. Trouver la tâche pour obtenir le classId
  const task = await this.taskModel.findById(taskId).exec();
  if (!task) {
    return false;
  }
  
  // 2. Vérifier si l'utilisateur est enseignant de cette classe
  return this.checkMembershipRole(userId, task.classId, MembershipRole.TEACHER);
}
```

### 5. Mettre à jour la stratégie JWT (optionnel pour la phase 1)
Enrichir le token JWT avec les informations de membership (à implémenter dans une phase ultérieure):

```typescript
// Dans auth.service.ts lors de la génération du token
async login(user: any) {
  // 1. Récupérer les adhésions où l'utilisateur est enseignant
  const teacherMemberships = await this.membershipService.findByUserAndRole(
    user._id,
    MembershipRole.TEACHER
  );
  
  // 2. Extraire les IDs des classes
  const teacherClassIds = teacherMemberships.map(m => m.classId);
  
  const payload = { 
    sub: user._id, 
    email: user.email, 
    role: user.role,
    teacherOf: teacherClassIds // Ajouter cette information au token
  };
  
  return {
    access_token: this.jwtService.sign(payload),
  };
}
```

## Tests à effectuer
Pour valider l'implémentation, il faudra tester les scénarios suivants:

1. Jean Dupont (enseignant de la classe) doit pouvoir accéder aux soumissions des élèves pour les tâches de sa classe
2. Jean Dupont ne doit pas pouvoir accéder aux soumissions des tâches dont il n'est pas l'enseignant
3. Alice Gribouille (élève) doit pouvoir accéder uniquement à ses propres soumissions
4. Super Admin doit pouvoir accéder à toutes les soumissions

## Points importants
- L'implémentation doit être générique et réutilisable pour d'autres ressources liées aux classes
- Les performances doivent être prises en compte (minimiser les requêtes à la base de données)
- La sécurité est primordiale - s'assurer qu'aucune faille n'est introduite
- Documenter clairement le nouveau système d'autorisation pour faciliter sa maintenance future

## Bonus
- Implémenter un système de cache pour les vérifications d'adhésion fréquentes
- Ajouter des tests unitaires et d'intégration pour le nouveau système
- Créer un middleware qui précharge les informations d'adhésion pour optimiser les performances 