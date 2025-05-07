## 📘 Utilisateur (`User`)

Représente un compte utilisateur de la plateforme. Chaque utilisateur peut avoir différents rôles.

### Champs

| Champ           | Type                      | Description                                                                 |
|-----------------|---------------------------|-----------------------------------------------------------------------------|
| `_id`           | string (ObjectId)         | Identifiant unique (généré par MongoDB, exposé en tant que `id` dans l'API)  |
| `email`         | string                    | Adresse email unique (automatiquement trim & lowercase)                       |
| `password`      | string                    | Hash du mot de passe (requis, `writeOnly` dans l'API)                        |
| `firstName`     | string                    | Prénom (automatiquement trim)                                                 |
| `lastName`      | string                    | Nom de famille (automatiquement trim)                                       |
| `avatarUrl`     | string \| undefined       | URL d'un avatar (optionnel)                                                 |
| `emailVerified` | boolean (défaut: `false`) | Indique si l'email de l'utilisateur a été vérifié                             |
| `role`          | `UserRole` (enum)         | Rôle global: `"admin"` \| `"user"` (défaut: `"user"`)                       |
| `createdAt`     | Date                      | Date de création (automatiquement gérée par la base de données)               |
| `updatedAt`     | Date                      | Date de dernière modification (automatiquement gérée par la base de données)  |

### Relations

- `memberships`: Liste des inscriptions à des classes (via `Membership`)

---

## 🏫 Classe (`Class`)

Une classe correspond à un groupe d'utilisateurs. Chaque classe est créée par un enseignant et peut être rejointe via un code d'accès temporaire.

### Champs

| Champ           | Type          | Description                                          |
|----------------|---------------|------------------------------------------------------|
| `_id`           | string (UUID) | Identifiant unique                                  |
| `name`          | string        | Nom de la classe donné par l'enseignant             |
| `desc`          | string        | Description libre                                    |
| `level`         | string        | Niveau libre (ex: "2nde", "Terminale", etc.)        |
| `year`          | number        | Année scolaire (ex: 2024)                            |
| `code`          | string        | Code d'accès temporaire pour rejoindre la classe     |
| `codeCreatedAt` | Date          | Date de génération du code d'accès (valable 3 jours)|
| `archived`      | boolean       | Indique si la classe est archivée                   |
| `createdAt`     | Date          | Date de création                                    |

### Relations

- `memberships`: Liste des utilisateurs inscrits (via `Membership`)

---

## 👥 Inscription à une classe (`Membership`)

Représente le lien entre un utilisateur et une classe. Ce lien contient aussi le rôle (élève, enseignant) et l'état d'activation.

### Champs

| Champ       | Type          | Description                                          |
|-------------|---------------|------------------------------------------------------|
| `_id`       | string (UUID) | Identifiant unique                                  |
| `userId`    | string        | Référence vers `User._id`                           |
| `classId`   | string        | Référence vers `Class._id`                          |
| `role`      | string        | "Student", "Teacher" (extensible)              |
| `status`    | string        | "pending", "active", "removed"               |
| `joinedAt`  | Date          | Date d'entrée dans la classe                        |
| `isActive`  | boolean       | Active ou non (suppression logique, default: `true`)|

### Contraintes

- Unicité du couple `(userId, classId)` : un utilisateur ne peut avoir qu'un rôle dans une classe à la fois.

---

## 📜 Tâche (`Task`)

Représente un devoir ou une activité créée par un enseignant pour une classe donnée. Elle contient un énoncé, une description interne, une éventuelle date limite, et peut inclure des ressources complémentaires.

### Champs

| Champ         | Type                  | Description                                                |
|---------------|-----------------------|------------------------------------------------------------|
| `_id`         | string (UUID)         | Identifiant unique                                         |
| `title`       | string                | Titre de la tâche                                          |
| `description` | string                | Description interne ou administrative                      |
| `utterance`   | string \| null        | Énoncé à destination des élèves                            |
| `imageUrl`    | string \| null        | URL d'une image complémentaire (S3)                        |
| `dueDate`     | Date \| null          | Date limite de remise (optionnelle)                        |
| `status`      | string                | "draft" \| "published" \| "archived"                 |
| `classId`     | string                | Référence vers la classe cible                             |
| `createdById` | string                | Référence vers l'utilisateur créateur                      |
| `createdAt`   | Date                  | Date de création                                           |
| `publishedAt` | Date \| null          | Date de publication                                        |
| `closedAt`    | Date \| null          | Date de clôture éventuelle de la tâche                     |
| `resources`   | TaskResource[]        | Liste des fichiers liés à la tâche                         |

### Relations

- `class`: Classe à laquelle la tâche est assignée
- `createdBy`: Enseignant ayant créé la tâche
- `copies`: Soumissions rendues par les élèves (1 par élève)

---

## 📌 Ressource attachée à une tâche (`TaskResource`)

Ressource pédagogique liée à une tâche, stockée sur un bucket S3.

### Champs (inline dans `Task.resources[]`)

| Champ               | Type        | Description                                          |
|--------------------|-------------|------------------------------------------------------|
| `name`             | string      | Nom affiché (ex: "Énoncé", "Correction")            |
| `s3Key`            | string      | Clé S3 du fichier                                    |
| `mimeType`         | string      | Type MIME (ex: "application/pdf")                   |
| `visibleToStudents`| boolean     | Visibilité pour les élèves (`true` ou `false`)      |

---

## 📄 Soumission (`Submission`)

Représente le rendu d'un élève pour une tâche donnée. Chaque élève ne peut soumettre qu'une seule fois par tâche.

### Champs

| Champ            | Type              | Description                                                |
|------------------|-------------------|------------------------------------------------------------|
| `_id`            | string (UUID)     | Identifiant unique                                         |
| `studentId`      | string            | Référence vers l'élève ayant soumis                        |
| `taskId`         | string            | Référence vers la tâche associée                           |
| `uploadedBy`     | string            | Référence vers l'utilisateur ayant uploadé (prof ou élève)     |
| `status`         | string            | "draft" \| "submitted" \| "corrected" \| "archived" |
| `rawPages`       | string[]          | Clés S3 des images originales (non traitées)               |
| `processedPages` | string[]          | Clés S3 des images traitées (redressées)                    |
| `createdAt`      | Date              | Date de création (auto)                                    |
| `submittedAt`    | Date \| null      | Date effective de soumission                               |
| `reviewedAt`     | Date \| null      | Date de validation ou de correction                        |

### Contraintes

- Une seule soumission par élève et par tâche (`unique: [studentId, taskId]`)

---

## ✏️ Correction (`Correction`)

Représente la correction d'une copie (`Submission`) faite par un enseignant. Contient les annotations, la note globale, l'appréciation finale, ainsi que les dates clés.

### Champs

| Champ          | Type              | Description                                                |
|----------------|-------------------|------------------------------------------------------------|
| `_id`          | string (UUID)     | Identifiant unique                                         |
| `submissionId` | string            | Référence vers la copie soumise                            |
| `correctedById`| string            | Référence vers l'enseignant ayant corrigé                  |
| `status`       | string            | "in_progress" \| "completed"                           |
| `annotations`  | string            | Données de correction (texte ou JSON libre)                |
| `grade`        | number            | Note globale attribuée à la copie                          |
| `appreciation` | string            | Appréciation finale rédigée                                |
| `createdAt`    | Date              | Date de création                                           |
| `updatedAt`    | Date              | Dernière modification                                      |
| `finalizedAt`  | Date \| null      | Date de finalisation de la correction                      |

### Contraintes

- Une seule correction par `submission` (`unique: submissionId`)

---

## 💬 Commentaire (`Comment`)

Représente un commentaire associé à une soumission. Permet aux enseignants et élèves de discuter d'une copie.

### Champs

| Champ          | Type              | Description                                                |
|----------------|-------------------|------------------------------------------------------------|
| `_id`          | string (UUID)     | Identifiant unique                                         |
| `submissionId` | string            | Référence vers la copie soumise                            |
| `userId`       | string            | Référence vers l'utilisateur ayant créé le commentaire     |
| `content`      | string            | Contenu textuel du commentaire                             |
| `parentId`     | string \| null    | Référence vers un commentaire parent (réponses)            |
| `createdAt`    | Date              | Date de création                                           |
| `updatedAt`    | Date              | Dernière modification                                      |

### Relations

- `submission`: Soumission à laquelle le commentaire est attaché
- `user`: Utilisateur ayant créé le commentaire
- `parent`: Commentaire parent (si réponse)
- `replies`: Liste des réponses à ce commentaire

---

## 🔍 Annotation (`Annotation`)

Représente une annotation spécifique attachée à une partie précise d'une soumission, avec des métadonnées JSON.

### Champs

| Champ          | Type              | Description                                                |
|----------------|-------------------|------------------------------------------------------------|
| `_id`          | string (UUID)     | Identifiant unique                                         |
| `submissionId` | string            | Référence vers la copie soumise                            |
| `userId`       | string            | Référence vers l'utilisateur ayant créé l'annotation       |
| `pageNumber`   | number            | Numéro de la page concernée (1-indexé)                     |
| `position`     | object            | Position sur la page `{x: number, y: number, width: number, height: number}` |
| `metadata`     | object            | Métadonnées JSON (contenu, type, etc.)                     |
| `createdAt`    | Date              | Date de création                                           |
| `updatedAt`    | Date              | Dernière modification                                      |

### Relations

- `submission`: Soumission à laquelle l'annotation est attachée
- `user`: Utilisateur ayant créé l'annotation

---

## 📅 Journal d'activités (`AuditLog`)

Permet de tracer les actions utilisateur importantes pour le suivi et la transparence.

### Champs

| Champ         | Type           | Description                                         |
|---------------|----------------|-----------------------------------------------------|
| `_id`         | string (UUID)  | Identifiant unique                                 |
| `userId`      | string         | Référence vers l'utilisateur ayant agi             |
| `action`      | string         | Description courte de l'action                     |
| `targetType`  | string         | Type d'entité visée ("Task", "Submission", etc.)    |
| `targetId`    | string         | Identifiant de l'entité cible                      |
| `timestamp`   | Date           | Date et heure de l'action                          |
| `valueBefore` | string         | Valeur avant l'action                          |
| `valueAfter`  | string         | Valeur après l'action                          |



## 📚 API – Gestion des Classes & Inscriptions

### ✅ [POST] /classes  
Crée une nouvelle classe (enseignant)

#### Input
```json
{
  "name": "Spé Maths 1",
  "desc": "Groupe A - Terminale",
  "level": "Terminale",
  "year": 2025
}
```

#### Règles
- L'utilisateur doit être authentifié
- Un code d'accès est généré automatiquement
- `Membership` créé automatiquement avec `role: "Teacher"`

---

### ✅ [GET] /classes  
Liste les classes visibles par l'utilisateur

#### Règles
- Si `User.role = "admin"` → retourne toutes les classes
- Sinon → retourne les classes liées à l'utilisateur via `Membership`

---

### ✅ [POST] /classes/join  
Rejoindre une classe avec un code d'accès

#### Input
```json
{
  "code": "ABC123"
}
```

#### Règles
- Le code doit exister et avoir été généré depuis moins de 3 jours
- Crée un `Membership` avec `role: "Student"` si non existant
- Retourne une erreur si l'utilisateur est déjà membre

---

### ✅ [GET] /classes/:id/members  
Liste les membres d'une classe, regroupés par rôle

#### Règles
- Autorisé pour :
  - Membres `Teacher` de la classe
  - Utilisateurs `admin`

---

### ✅ [PATCH] /classes/:id/archive  
Archive une classe (readonly)

#### Règles
- Seul un `Teacher` ou `admin` peut archiver une classe
- Met à jour le champ `archived = true`
- Les élèves ne peuvent plus interagir avec les tâches/soumissions de cette classe

---

### ✅ [POST] /classes/:id/regenerate-code  
Régénère le code d'accès d'une classe

#### Règles
- Réservé aux enseignants ou admins
- Génère un nouveau code + met à jour `codeCreatedAt`

---

## 📘 API – Gestion des Tâches (`Task`)

### ✅ [POST] /tasks  
Crée une nouvelle tâche dans une classe

#### Input
```json
{
  "title": "DM n°2 - Suites numériques",
  "description": "À rendre avant vendredi",
  "utterance": "Résoudre les exercices 3 à 6 page 45.",
  "imageUrl": "https://s3.amazonaws.com/bucket/images/sujet.png",
  "dueDate": "2025-03-01T23:59:59Z",
  "classId": "abc123"
}
```

#### Règles
- L'utilisateur doit être `Teacher` dans la classe cible
- `status` initial = "draft"
- `createdById` est automatiquement rempli

---

### ✅ [GET] /tasks/:id  
Retourne les détails d'une tâche

#### Règles
- Accessible aux enseignants et élèves **membres de la classe**
- Les ressources `visibleToStudents: false` sont masquées pour les élèves

---

### ✅ [GET] /classes/:classId/tasks  
Liste toutes les tâches d'une classe

#### Règles
- Filtrage possible par statut (`draft`, `published`, `archived`)
- Résultat adapté selon le rôle :
  - élève = uniquement tâches publiées
  - enseignant = toutes les tâches

---

### ✅ [PATCH] /tasks/:id  
Met à jour les champs d'une tâche

#### Input (exemple)
```json
{
  "title": "DM n°2 - Suites et fonctions",
  "dueDate": "2025-03-03T23:59:59Z"
}
```

#### Règles
- L'utilisateur doit être `Teacher` ou `admin`
- Seules les tâches non archivées peuvent être modifiées

---

### ✅ [PATCH] /tasks/:id/publish  
Publie une tâche

#### Règles
- Passe `status` à `published`
- Remplit `publishedAt`
- Les tâches publiées ne sont modifiables que par un `admin`

---

### ✅ [PATCH] /tasks/:id/archive  
Archive une tâche

#### Règles
- Passe `status` à `archived`
- Clôt les soumissions
- Réservé aux `Teacher` ou `admin`

---

### ✅ [POST] /tasks/:id/resources  
Ajoute une ressource à une tâche

#### Input
```json
{
  "name": "Corrigé officiel",
  "s3Key": "uploads/dm2/correction.pdf",
  "mimeType": "application/pdf",
  "visibleToStudents": false
}
```

#### Règles
- Append dans `resources[]`
- Réservé aux enseignants

---

### ✅ [DELETE] /tasks/:taskId/resources/:index  
Supprime une ressource par son index dans le tableau

#### Règles
- Autorisé uniquement aux enseignants ou `admin`
- Ne supprime pas le fichier sur S3

---

## 📝 API – Soumissions (`Submission`)

### ✅ [POST] /submissions  
Crée une soumission (copie de l'élève pour une tâche)

#### Input
```json
{
  "taskId": "abc123",
  "rawPages": [
    "uploads/subm1/page1.jpg",
    "uploads/subm1/page2.jpg"
  ]
}
```

#### Règles
- L'utilisateur doit être `Student` dans la classe
- Une seule soumission par (user, task)
- `uploadedBy` rempli automatiquement

---

### ✅ [GET] /tasks/:taskId/submissions  
Liste les soumissions à une tâche

#### Règles
- Réservé aux `Teacher` et `admin`

---

### ✅ [GET] /submissions/:id  
Détail d'une soumission

#### Règles
- Accessible par :
  - l'élève auteur
  - les `Teacher` ou `admin`

---

### ✅ [PATCH] /submissions/:id  
Met à jour une soumission

#### Input
```json
{
  "processedPages": [
    "uploads/subm1/page1-cleaned.jpg",
    "uploads/subm1/page2-cleaned.jpg"
  ],
  "status": "submitted"
}
```

#### Règles
- Modifiable uniquement par l'auteur ou un `Teacher`
- Passage à `submitted` remplit `submittedAt`

---

## ✏️ API – Corrections (`Correction`)

### ✅ [POST] /corrections  
Crée une correction pour une soumission

#### Input
```json
{
  "submissionId": "xyz123",
  "annotations": "{...}",
  "grade": 14.5,
  "appreciation": "Bon travail, attention aux erreurs d'étourderie."
}
```

#### Règles
- Une seule correction par `submission`
- Réservé aux `Teacher` ou `admin`

---

### ✅ [GET] /submissions/:submissionId/correction  
Récupère la correction liée à une soumission

#### Règles
- Accessible à l'élève concerné, `Teacher`, ou `admin`

---

### ✅ [PATCH] /corrections/:id  
Met à jour la correction

#### Règles
- Possible uniquement si `status != completed`, sauf pour `admin`
- Passage à `completed` remplit `finalizedAt`

---

## 💬 API – Commentaires (`Comment`)

### ✅ [POST] /comments  
Crée un nouveau commentaire sur une soumission

#### Input
```json
{
  "submissionId": "xyz123",
  "content": "Excellent travail sur cette partie du devoir",
  "parentId": null
}
```

#### Règles
- L'utilisateur doit être membre de la classe (enseignant ou élève)
- `userId` est automatiquement ajouté
- `parentId` est optionnel (null si commentaire racine)

---

### ✅ [GET] /comments/submission/:submissionId  
Liste les commentaires d'une soumission

#### Règles
- Accessible au propriétaire de la soumission et aux enseignants de la classe
- Retourne les commentaires organisés en thread (commentaires + réponses)

---

### ✅ [GET] /comments/:id  
Récupère un commentaire spécifique

#### Règles
- Accessible aux membres de la classe concernée

---

### ✅ [PATCH] /comments/:id  
Met à jour un commentaire

#### Input
```json
{
  "content": "Contenu modifié du commentaire"
}
```

#### Règles
- Modifiable uniquement par l'auteur du commentaire
- Les administrateurs peuvent modifier tous les commentaires

---

### ✅ [DELETE] /comments/:id  
Supprime un commentaire

#### Règles
- Supprimable par l'auteur du commentaire
- Les enseignants peuvent supprimer les commentaires de leur classe
- Les administrateurs peuvent supprimer n'importe quel commentaire

---

## 🔍 API – Annotations (`Annotation`)

### ✅ [POST] /annotations  
Crée une nouvelle annotation sur une soumission

#### Input
```json
{
  "submissionId": "xyz123",
  "pageNumber": 2,
  "position": {
    "x": 150,
    "y": 200,
    "width": 100,
    "height": 50
  },
  "metadata": {
    "type": "highlight",
    "color": "yellow",
    "comment": "Très bonne explication"
  }
}
```

#### Règles
- Accessible aux enseignants de la classe
- `userId` est automatiquement ajouté
- Le format JSON de `metadata` est flexible

---

### ✅ [GET] /annotations/submission/:submissionId  
Liste les annotations d'une soumission

#### Règles
- Accessible au propriétaire de la soumission et aux enseignants de la classe
- Peut être filtré par page avec `?pageNumber=2`

---

### ✅ [GET] /annotations/:id  
Récupère une annotation spécifique

#### Règles
- Accessible aux membres de la classe concernée

---

### ✅ [PATCH] /annotations/:id  
Met à jour une annotation

#### Input
```json
{
  "position": {
    "x": 160,
    "y": 210,
    "width": 120,
    "height": 60
  },
  "metadata": {
    "type": "highlight",
    "color": "red",
    "comment": "Erreur de calcul ici"
  }
}
```

#### Règles
- Modifiable uniquement par l'auteur de l'annotation
- Les champs peuvent être mis à jour partiellement

---

### ✅ [DELETE] /annotations/:id  
Supprime une annotation

#### Règles
- Supprimable par l'auteur de l'annotation
- Les administrateurs peuvent supprimer n'importe quelle annotation

---

## 📜 API – Journalisation (`AuditLog`)

### ✅ [POST] /logs  
Crée une entrée de log

#### Input
```json
{
  "action": "submission_submitted",
  "targetType": "Submission",
  "targetId": "xyz123"
}
```

#### Règles
- `userId` et `timestamp` sont ajoutés automatiquement

---

### ✅ [GET] /logs?targetType=Submission&targetId=xyz123  
Liste les logs liés à une entité

#### Règles
- Accessible à `admin` uniquement


## 📘 PRD – Workflows d'état (Étape 3)

Ce document formalise les transitions possibles des champs `status` pour les principales entités métier. Ces règles permettent de sécuriser la logique métier, guider l'implémentation des API et prévenir les états incohérents.

---

### 🔁 `Task.status`

| Statut actuel | Transitions possibles                   |
|---------------|------------------------------------------|
| `draft`       | → `published`, `archived`               |
| `published`   | → `draft`, `archived`                   |
| `archived`    | (readonly)                              |

#### Notes
- Une tâche peut être "dépubliée" (repasse en `draft`)
- Une tâche archivée devient en lecture seule

---

### 🔁 `Submission.status`

| Statut actuel | Transitions possibles                         |
|---------------|------------------------------------------------|
| `draft`       | → `submitted`, `archived`                      |
| `submitted`   | → `corrected`, `archived`                      |
| `corrected`   | → `archived`                                   |
| `archived`    | (readonly)                                     |

#### Notes
- Le statut `in_review` est supprimé pour simplification
- Une soumission peut être archivée à tout moment (ex : erreur, retrait)

---

### 🔁 `Correction.status`

| Statut actuel | Transitions possibles         |
|---------------|-------------------------------|
| `in_progress` | → `completed`                 |
| `completed`   | → `in_progress` (admin/teacher)|

#### Notes
- Une correction finalisée peut être réouverte si besoin
- Historique des modifications traçable via `AuditLog`

---

### 🔒 Permissions générales sur les transitions

| Entité      | Transitions contrôlées par         |
|-------------|-------------------------------------|
| `Task`      | Enseignant créateur ou admin        |
| `Submission`| Élève auteur ou enseignant de classe|
| `Correction`| Enseignant ou admin                 |

Les validations côté backend doivent vérifier la transition et l'autorisation de l'utilisateur avant mise à jour.



## 📘 PRD – Workflows d'état (Étape 3)

Ce document formalise les transitions possibles des champs `status` pour les principales entités métier. Ces règles permettent de sécuriser la logique métier, guider l'implémentation des API et prévenir les états incohérents.

---

### 🔁 `Task.status`

| Statut actuel | Transitions possibles                   |
|---------------|------------------------------------------|
| `draft`       | → `published`, `archived`               |
| `published`   | → `draft`, `archived`                   |
| `archived`    | (readonly)                              |

#### Notes
- Une tâche peut être "dépubliée" (repasse en `draft`)
- Une tâche archivée devient en lecture seule

---

### 🔁 `Submission.status`

| Statut actuel | Transitions possibles                         |
|---------------|------------------------------------------------|
| `draft`       | → `submitted`, `archived`                      |
| `submitted`   | → `corrected`, `archived`                      |
| `corrected`   | → `archived`                                   |
| `archived`    | (readonly)                                     |

#### Notes
- Le statut `in_review` est supprimé pour simplification
- Une soumission peut être archivée à tout moment (ex : erreur, retrait)

---

### 🔁 `Correction.status`

| Statut actuel | Transitions possibles         |
|---------------|-------------------------------|
| `in_progress` | → `completed`                 |
| `completed`   | → `in_progress` (admin/teacher)|

#### Notes
- Une correction finalisée peut être réouverte si besoin
- Historique des modifications traçable via `AuditLog`

---

### 🔒 Permissions générales sur les transitions

| Entité      | Transitions contrôlées par         |
|-------------|-------------------------------------|
| `Task`      | Enseignant créateur ou admin        |
| `Submission`| Élève auteur ou enseignant de classe|
| `Correction`| Enseignant ou admin                 |

Les validations côté backend doivent vérifier la transition et l'autorisation de l'utilisateur avant mise à jour.

---

## 🛡️ Permissions par ressource et action

| Ressource     | Action                | Rôles autorisés                          |
|---------------|-----------------------|------------------------------------------|
| `Class`       | Créer                 | Teacher, Admin                           |
| `Class`       | Voir                  | Membre de la classe, Admin               |
| `Class`       | Rejoindre             | Utilisateur authentifié avec code        |
| `Class`       | Voir membres          | Teacher de la classe, Admin              |
| `Class`       | Archiver              | Teacher, Admin                           |
| `Task`        | Créer / Modifier      | Teacher de la classe, Admin              |
| `Task`        | Voir                  | Membres de la classe (selon visibilité)  |
| `Task`        | Publier / Archiver    | Teacher, Admin                           |
| `Submission`  | Créer / Modifier      | Élève auteur, ou Teacher pour un élève   |
| `Submission`  | Voir (sa propre)      | Élève auteur                             |
| `Submission`  | Voir (toutes)         | Teacher de la classe, Admin              |
| `Correction`  | Créer / Modifier      | Teacher de la classe, Admin              |
| `Correction`  | Voir                  | Élève concerné, Teacher, Admin           |
| `Comment`     | Créer                 | Membres de la classe                     |
| `Comment`     | Modifier / Supprimer  | Auteur du commentaire, Teacher, Admin    |
| `Comment`     | Voir                  | Membres de la classe                     |
| `Annotation`  | Créer / Modifier      | Teacher de la classe, Admin              |
| `Annotation`  | Voir                  | Élève concerné, Teacher de la classe, Admin |
| `AuditLog`    | Créer (auto backend)  | Tous                                     |
| `AuditLog`    | Lire                  | Admin uniquement (ou élargissable)       |

---

## 📁 Structure suggérée du projet NestJS

Voici une arborescence proposée pour organiser proprement les modules, en cohérence avec le PRD :

```
src/
├── modules/
│   ├── users/
│   │   ├── user.controller.ts
│   │   ├── user.dto.ts
│   │   ├── user.interface.ts
│   │   ├── user.module.ts
│   │   ├── user.schema.ts
│   │   └── user.service.ts
│   ├── classes/
│   ├── memberships/
│   ├── tasks/
│   ├── submissions/
│   ├── corrections/
│   ├── comments/
│   ├── annotations/
│   └── audit-log/
├── common/
│   ├── guards/
│   ├── interceptors/
│   ├── decorators/
│   └── filters/
├── config/
│   └── s3.config.ts (ex: pour uploads sécurisés)
├── main.ts
└── app.module.ts
```

Chaque dossier `module` peut suivre le pattern : controller + service + schema + DTOs, avec tests unitaires à part.


## 🏗️ Architecture backend et choix techniques

### 📦 Base de données
Le projet utilise **MongoDB** comme base de données principale, avec Mongoose pour la couche ODM. Chaque entité métier correspond à un `@Schema()` décoré pour Mongoose.

Cependant, par souci de découplage :

- **L'application n'utilise jamais Mongoose directement dans les services métier**
- Une **interface de repository** est définie pour chaque entité
- Une **implémentation Mongoose** (nommée `Mongo<Class>Repository`) est injectée dans le module

Ce choix permet de :
- Faciliter les tests (ex: `InMemory<Class>Repository`)
- Préparer une future migration éventuelle (PostgreSQL, etc.)

### 🧱 Exemple de structure (pattern hexagonal léger)

```
modules/
├── tasks/
│   ├── task.controller.ts
│   ├── task.service.ts (utilise ITaskRepository)
│   ├── task.repository.ts (interface)
│   ├── mongo-task.repository.ts (implémentation mongoose)
```




