# Analyse du problème d'autorisation pour les soumissions

## Problème identifié

En examinant le code, j'ai identifié plusieurs problèmes qui empêchent Jean Dupont (un enseignant de la classe) d'accéder aux soumissions:

1. **Le endpoint GET /submissions est restreint aux administrateurs uniquement**:
   ```typescript
   @Get()
   @AdminOnly
   @RequirePermission(Permission.READ_SUBMISSIONS, 'list')
   async findAll(@Query('taskId') taskId?: string): Promise<Submission[]> {
     // ...
   }
   ```
   Le décorateur `@AdminOnly` restreint l'accès à ce endpoint aux utilisateurs ayant le rôle global `ADMIN`, ce qui n'est pas le cas de Jean Dupont (qui a le rôle `USER`).

2. **Le guard de permissions n'implémente pas la logique de vérification du rôle d'enseignant**:
   Dans `permission.guard.ts`, il y a un commentaire indiquant que la logique pour les autorisations basées sur le rôle d'adhésion devrait être implémentée, mais cette logique n'est pas codée:
   ```typescript
   // Some actions are allowed based on Membership context
   // This logic would be implemented here with the help of a MembershipService
   
   // For example, for tasks in a class where the user is a teacher:
   /*
   if (resource === 'Task' && action === 'create') {
     const classId = params.classId || body.classId;
     if (classId && await this.membershipService.isTeacher(user.id, classId)) {
       return true;
     }
   }
   */
   ```

3. **Le token JWT contient seulement le rôle global**, pas les rôles spécifiques aux classes:
   ```
   "role":"user"
   ```
   Le token ne contient pas d'information sur les adhésions de l'utilisateur aux classes.

## Solutions proposées

### Solution à court terme

1. **Modifier le contrôleur de soumissions**:
   - Remplacer `@AdminOnly` par `@AuthenticatedUser` pour le endpoint GET
   - Ajouter la vérification du rôle d'enseignant dans le service:

```typescript
@Get()
@ApiOperation({ summary: 'Get all submissions with optional filtering' })
@ApiQuery({ name: 'taskId', required: false, description: 'Filter submissions by task ID' })
@ApiQuery({ name: 'classId', required: false, description: 'Filter submissions by class ID' })
@ApiResponse({ status: 200, description: 'List of submissions.', type: [Submission] })
@ApiResponse({ status: 401, description: 'Unauthorized.' })
@ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions.' })
@AuthenticatedUser
@RequirePermission(Permission.READ_SUBMISSIONS, 'list')
async findAll(
  @Query('taskId') taskId?: string,
  @Query('classId') classId?: string
): Promise<Submission[]> {
  const user = this.request.user;
  
  // Si admin, retourner toutes les soumissions
  if (user.role === UserRole.ADMIN) {
    if (taskId) {
      return this.submissionService.findByTask(taskId);
    }
    if (classId) {
      return this.submissionService.findByClass(classId);
    }
    return this.submissionService.findAll();
  }
  
  // Si utilisateur normal, vérifier le rôle dans la classe
  if (taskId) {
    // Vérifier que l'utilisateur est enseignant de la classe associée à cette tâche
    const hasAccess = await this.membershipService.isTeacherForTask(user.sub, taskId);
    if (hasAccess) {
      return this.submissionService.findByTask(taskId);
    }
  }
  
  if (classId) {
    // Vérifier que l'utilisateur est enseignant de cette classe
    const hasAccess = await this.membershipService.isTeacher(user.sub, classId);
    if (hasAccess) {
      return this.submissionService.findByClass(classId);
    }
  }
  
  // Sinon, retourner uniquement les soumissions de l'utilisateur
  return this.submissionService.findByStudent(user.sub);
}
```

### Solution à long terme

1. **Implémenter le PermissionGuard pour vérifier les rôles d'adhésion**:
   - Ajouter l'injection du MembershipService dans le guard
   - Implémenter la logique commentée pour vérifier les rôles d'adhésion

2. **Créer un guard spécifique pour les soumissions**:
   - Similaire au CommentAccessGuard, créer un SubmissionAccessGuard qui vérifie:
     - Si l'utilisateur est l'auteur de la soumission
     - Si l'utilisateur est enseignant de la classe associée
     - Si l'utilisateur est administrateur

3. **Enrichir le token JWT** avec des informations sur les rôles d'adhésion:
   - Ajouter un champ `memberships` dans le token JWT qui contient les ID des classes où l'utilisateur est enseignant
   - Mettre à jour la stratégie JWT pour vérifier ce champ

## Conclusion

Le problème principal est que l'autorisation est basée uniquement sur le rôle global de l'utilisateur (USER/ADMIN) au lieu de prendre en compte le rôle d'adhésion (teacher/student) dans les classes spécifiques. 

Pour une solution immédiate, je recommande de modifier le contrôleur des soumissions comme indiqué ci-dessus. Pour une solution plus robuste à long terme, il faudrait implémenter une vérification d'autorisation plus sophistiquée qui prend en compte les rôles d'adhésion. 