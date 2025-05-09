import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

import { User, UserDocument, UserRole } from '../../modules/users/user.schema';
import { Class } from '../../modules/classes/class.schema';
import { Task, TaskStatus } from '../../modules/tasks/task.schema';
import { Membership, MembershipRole, MembershipStatus } from '../../modules/memberships/membership.schema';
import { Submission, SubmissionStatus as SubmissionStatusEnum } from '../../modules/submissions/submission.schema';
import { Correction, CorrectionStatus } from '../../modules/corrections/correction.schema';
import { Comment, CommentDocument } from '../../modules/comments/comment.schema';
import { AIComment, AICommentDocument } from '../../modules/ai-comments/ai-comment.schema';
import { Annotation, AnnotationDocument } from '../../modules/annotations/annotation.schema';

// Interfaces to define the JSON structure
export interface UserSeedData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  role: UserRole;
  emailVerified: boolean;
}

export interface ClassSeedData {
  name: string;
  description?: string;
  code?: string;
  settings?: Record<string, any>;
  startDate?: Date;
  endDate?: Date;
  archived?: boolean;
  createdBy: string; // Email of the creator user
}

export interface TaskSeedData {
  title: string;
  description?: string;
  className: string; // Name of the class
  createdBy: string; // Email of the creator user
  status?: TaskStatus;
  dueDate?: Date;
  points?: number;
  tags?: string[];
  metadata?: Record<string, any>;
  settings?: Record<string, any>;
}

export interface MembershipSeedData {
  userEmail: string;
  className: string;
  role: MembershipRole;
  status?: MembershipStatus;
  isActive?: boolean;
}

export interface SubmissionSeedData {
  userEmail: string; // Email of the student
  taskTitle: string; // Title of the task
  className: string; // Name of the class the task belongs to (to uniquely identify the task)
  rawPages: string[];
  processedPages?: string[];
  status?: SubmissionStatusEnum;
  submittedAt?: Date;
  // D'autres champs de CreateSubmissionDto pourraient être ajoutés ici si nécessaire pour le seeding
}

export interface CorrectionSeedData {
  id?: number;
  submissionUserEmail: string; // Email of the student who made the submission
  submissionTaskTitle: string; // Title of the task for the submission
  submissionClassName: string; // Class name for the submission's task
  correctorEmail: string; // Email of the user who corrects
  grade?: number;
  appreciation?: string;
  status?: string; // e.g., 'draft', 'published'
  correctedAt?: Date;
  // Add other fields from CreateCorrectionDto as needed for seeding
}

export interface AnnotationSeedData {
  id: number | string;
  correctionId: number | string;
  [key: string]: any;
}

export interface CommentSeedData {
  // Identifier la Correction parente
  submissionUserEmail: string; 
  submissionTaskTitle: string;
  submissionClassName: string;
  correctorEmail: string;

  // Auteur du commentaire
  authorEmail: string;

  // Champs du Commentaire
  pageNumber: number;
  type: string;
  color: string;
  text: string; // Contenu textuel simple/rendu
  markdownSource?: string; // Contenu Markdown brut
  isMarkdown: boolean;
  pageY?: number;
  annotations?: number[]; // Références aux annotations par leur ID logique
}

export interface AICommentSeedData {
  // Identifier la Correction parente
  id?: string;
  submissionUserEmail: string; 
  submissionTaskTitle: string;
  submissionClassName: string;
  correctorEmail: string;

  // Auteur du commentaire AI
  authorEmail: string;

  // Champs du Commentaire AI
  pageNumber: number;
  type: string;
  color: string;
  text: string; // Contenu textuel simple/rendu
  markdownSource?: string; // Contenu Markdown brut
  isMarkdown: boolean;
  pageY?: number;
  annotations?: number[]; // Références aux annotations par leur ID logique
}

export interface SeedData {
  users: UserSeedData[];
  classes: ClassSeedData[];
  tasks: TaskSeedData[];
  memberships: MembershipSeedData[];
  submissions: SubmissionSeedData[];
  corrections: CorrectionSeedData[];
  comments: CommentSeedData[];
  'ai-comments': AICommentSeedData[];
  annotations: AnnotationSeedData[];
}

@Injectable()
export class DataSeedService {
  private readonly logger = new Logger(DataSeedService.name);
  private readonly userIdMap: Map<string, string> = new Map(); // Map email -> userId
  private readonly classIdMap: Map<string, string> = new Map(); // Map name -> classId
  private readonly taskIdMap: Map<string, string> = new Map(); // Map title+className -> taskId
  private readonly submissionIdMap: Map<string, string> = new Map(); // Map studentEmail+taskTitle+className -> submissionId
  private readonly correctionIdMap: Map<string, string> = new Map(); // Map submissionId+correctorEmail -> correctionId
  private readonly annotationIdMap: Map<string, string> = new Map(); // Map logicalId -> annotationId

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Class.name) private classModel: Model<Class>,
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(Membership.name) private membershipModel: Model<Membership>,
    @InjectModel(Submission.name) private submissionModel: Model<Submission>,
    @InjectModel(Correction.name) private correctionModel: Model<Correction>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(AIComment.name) private aiCommentModel: Model<AICommentDocument>,
    @InjectModel(Annotation.name) private annotationModel: Model<AnnotationDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async seed(): Promise<void> {
    try {
      // Path to the data JSON file
      const seedFilePath = path.resolve('src/database/seeds/data/seed-data.json');
      const exampleFilePath = path.resolve('src/database/seeds/data/seed-data.example.json');
      
      // Check if the file exists
      if (!fs.existsSync(seedFilePath)) {
        this.logger.warn(`Seed file does not exist: ${seedFilePath}`);
        this.logger.warn(`Use the example file as a reference: ${exampleFilePath}`);
        return;
      }

      // Drop existing database
      this.logger.log('Dropping existing database...');
      await this.dropDatabase();
      this.logger.log('Database dropped successfully. Starting fresh seed process...');

      // Read JSON file
      const seedData: SeedData = JSON.parse(fs.readFileSync(seedFilePath, 'utf8'));

      // Seed entities in dependency order
      await this.seedUsers(seedData.users);
      await this.seedClasses(seedData.classes);
      await this.seedTasks(seedData.tasks);
      await this.seedMemberships(seedData.memberships);
      await this.seedSubmissions(seedData.submissions);
      await this.seedCorrections(seedData.corrections);
      await this.seedAnnotations(seedData.annotations);
      await this.seedComments(seedData.comments);
      await this.seedAIComments(seedData['ai-comments']);
      
      this.logger.log('Seeding process completed successfully!');
    } catch (error) {
      this.logger.error('Error during the seeding process:', error);
      throw error;
    }
  }

  /**
   * Drops all collections in the database
   */
  private async dropDatabase(): Promise<void> {
    try {
      // Get all collections
      const collections = await this.connection.db.collections();
      
      // Drop each collection
      for (const collection of collections) {
        await collection.deleteMany({});
        this.logger.log(`Cleared collection: ${collection.collectionName}`);
      }
      
      this.logger.log('All collections cleared successfully');
    } catch (error) {
      this.logger.error('Error dropping database:', error);
      throw error;
    }
  }

  private async seedUsers(users: UserSeedData[]): Promise<void> {
    if (!users || users.length === 0) {
      this.logger.log('No users to create.');
      return;
    }

    let createdCount = 0;
    
    for (const userData of users) {
      try {
        // Check if the user already exists
        const existingUser = await this.userModel.findOne({ email: userData.email });
        
        if (existingUser) {
          this.logger.log(`User ${userData.email} already exists.`);
          // Store ID for future references
          this.userIdMap.set(userData.email, existingUser._id.toString());
          continue;
        }
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        // Create the new user
        const newUser = await this.userModel.create({
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          avatarUrl: userData.avatarUrl,
          role: userData.role,
          emailVerified: userData.emailVerified,
        });
        
        // Store ID for future references
        this.userIdMap.set(userData.email, newUser._id.toString());
        
        createdCount++;
        this.logger.log(`User successfully created: ${userData.email}`);
      } catch (error) {
        this.logger.error(`Error while creating user ${userData.email}:`, error);
      }
    }
    
    this.logger.log(`Users seeding completed. ${createdCount} users created.`);
  }

  private async seedClasses(classes: ClassSeedData[]): Promise<void> {
    if (!classes || classes.length === 0) {
      this.logger.log('No classes to create.');
      return;
    }

    let createdCount = 0;
    
    for (const classData of classes) {
      try {
        // Check if the class already exists
        const existingClass = await this.classModel.findOne({ name: classData.name });
        
        if (existingClass) {
          this.logger.log(`Class ${classData.name} already exists.`);
          // Store ID for future references
          this.classIdMap.set(classData.name, existingClass._id.toString());
          continue;
        }
        
        // Find the creator's ID
        const createdById = this.userIdMap.get(classData.createdBy);
        if (!createdById) {
          this.logger.warn(`User ${classData.createdBy} does not exist. Cannot create class ${classData.name}.`);
          continue;
        }
        
        // Create the new class
        const newClass = await this.classModel.create({
          name: classData.name,
          description: classData.description,
          code: classData.code,
          settings: classData.settings || {},
          startDate: classData.startDate,
          endDate: classData.endDate,
          archived: classData.archived || false,
          createdBy: new Types.ObjectId(createdById),
        });
        
        // Store ID for future references
        this.classIdMap.set(classData.name, newClass._id.toString());
        
        createdCount++;
        this.logger.log(`Class successfully created: ${classData.name}`);
      } catch (error) {
        this.logger.error(`Error while creating class ${classData.name}:`, error);
      }
    }
    
    this.logger.log(`Classes seeding completed. ${createdCount} classes created.`);
  }

  private async seedTasks(tasks: TaskSeedData[]): Promise<void> {
    if (!tasks || tasks.length === 0) {
      this.logger.log('No tasks to create.');
      return;
    }

    let createdCount = 0;
    
    for (const taskData of tasks) {
      try {
        // Find the class ID
        const classId = this.classIdMap.get(taskData.className);
        if (!classId) {
          this.logger.warn(`Class ${taskData.className} does not exist. Cannot create task ${taskData.title}.`);
          continue;
        }
        
        // Find the creator's ID
        const createdById = this.userIdMap.get(taskData.createdBy);
        if (!createdById) {
          this.logger.warn(`User ${taskData.createdBy} does not exist. Cannot create task ${taskData.title}.`);
          continue;
        }
        
        // Check if the task already exists
        const existingTask = await this.taskModel.findOne({ 
          title: taskData.title,
          classId: new Types.ObjectId(classId)
        });
        
        if (existingTask) {
          this.logger.log(`Task ${taskData.title} already exists in class ${taskData.className}.`);
          this.taskIdMap.set(`${taskData.title}-${taskData.className}`, existingTask._id.toString());
          continue;
        }
        
        // Create the new task
        const newTask = await this.taskModel.create({
          title: taskData.title,
          description: taskData.description,
          classId: new Types.ObjectId(classId),
          createdBy: new Types.ObjectId(createdById),
          status: taskData.status || TaskStatus.DRAFT,
          dueDate: taskData.dueDate,
          points: taskData.points || 0,
          tags: taskData.tags || [],
          metadata: taskData.metadata || {},
          settings: taskData.settings || {},
        });
        
        this.taskIdMap.set(`${taskData.title}-${taskData.className}`, newTask._id.toString());
        createdCount++;
        this.logger.log(`Task successfully created: ${taskData.title} in class ${taskData.className}`);
      } catch (error) {
        this.logger.error(`Error while creating task ${taskData.title}:`, error);
      }
    }
    
    this.logger.log(`Tasks seeding completed. ${createdCount} tasks created.`);
  }

  private async seedMemberships(memberships: MembershipSeedData[]): Promise<void> {
    if (!memberships || memberships.length === 0) {
      this.logger.log('No memberships to create.');
      return;
    }

    let createdCount = 0;
    
    for (const membershipData of memberships) {
      try {
        // Find the user ID
        const userId = this.userIdMap.get(membershipData.userEmail);
        if (!userId) {
          this.logger.warn(`User ${membershipData.userEmail} does not exist. Cannot create membership.`);
          continue;
        }
        
        // Find the class ID
        const classId = this.classIdMap.get(membershipData.className);
        if (!classId) {
          this.logger.warn(`Class ${membershipData.className} does not exist. Cannot create membership.`);
          continue;
        }
        
        // Check if the membership already exists
        const existingMembership = await this.membershipModel.findOne({
          userId: new Types.ObjectId(userId),
          classId: new Types.ObjectId(classId),
        });
        
        if (existingMembership) {
          this.logger.log(`Membership for ${membershipData.userEmail} in class ${membershipData.className} already exists.`);
          continue;
        }
        
        // Create the new membership
        await this.membershipModel.create({
          userId: new Types.ObjectId(userId),
          classId: new Types.ObjectId(classId),
          role: membershipData.role,
          status: membershipData.status || MembershipStatus.ACTIVE,
          isActive: membershipData.isActive !== undefined ? membershipData.isActive : true,
          joinedAt: new Date(),
        });
        
        createdCount++;
        this.logger.log(`Membership successfully created: ${membershipData.userEmail} (${membershipData.role}) in class ${membershipData.className}`);
      } catch (error) {
        this.logger.error(`Error while creating membership for ${membershipData.userEmail} in class ${membershipData.className}:`, error);
      }
    }
    
    this.logger.log(`Memberships seeding completed. ${createdCount} memberships created.`);
  }

  private async seedSubmissions(submissions: SubmissionSeedData[]): Promise<void> {
    if (!submissions || submissions.length === 0) {
      this.logger.log('No submissions to create.');
      return;
    }

    let createdCount = 0;

    for (const subData of submissions) {
      try {
        const studentId = this.userIdMap.get(subData.userEmail);
        if (!studentId) {
          this.logger.warn(`User (student) ${subData.userEmail} does not exist. Cannot create submission for task ${subData.taskTitle}.`);
          continue;
        }

        const taskId = this.taskIdMap.get(`${subData.taskTitle}-${subData.className}`);
        if (!taskId) {
          this.logger.warn(`Task ${subData.taskTitle} in class ${subData.className} does not exist. Cannot create submission.`);
          continue;
        }

        // Check if submission already exists for this student and task
        const submissionKey = `${subData.userEmail}-${subData.taskTitle}-${subData.className}`;
        const existingSubmission = await this.submissionModel.findOne({
          studentId: new Types.ObjectId(studentId),
          taskId: new Types.ObjectId(taskId),
        });

        if (existingSubmission) {
          this.logger.log(`Submission for task ${subData.taskTitle} by student ${subData.userEmail} already exists.`);
          this.submissionIdMap.set(submissionKey, existingSubmission._id.toString());
          continue;
        }

        const newSubmission = await this.submissionModel.create({
          studentId: new Types.ObjectId(studentId),
          taskId: new Types.ObjectId(taskId),
          uploadedBy: new Types.ObjectId(studentId), // Assuming student uploads their own work
          rawPages: subData.rawPages,
          processedPages: subData.processedPages || [],
          status: subData.status || SubmissionStatusEnum.DRAFT,
          submittedAt: subData.submittedAt,
          // createdAt and updatedAt will be set automatically by Mongoose
        });
        
        this.submissionIdMap.set(submissionKey, newSubmission._id.toString());
        createdCount++;
        this.logger.log(`Submission successfully created for task ${subData.taskTitle} by student ${subData.userEmail}`);
      } catch (error) {
        this.logger.error(`Error while creating submission for task ${subData.taskTitle} by ${subData.userEmail}:`, error);
      }
    }
    this.logger.log(`Submissions seeding completed. ${createdCount} submissions created.`);
  }

  private async seedCorrections(corrections: CorrectionSeedData[]): Promise<void> {
    if (!corrections || corrections.length === 0) {
      this.logger.log('No corrections to create.');
      return;
    }

    let createdCount = 0;

    for (const corrData of corrections) {
      try {
        const submissionKey = `${corrData.submissionUserEmail}-${corrData.submissionTaskTitle}-${corrData.submissionClassName}`;
        const submissionId = this.submissionIdMap.get(submissionKey);
        if (!submissionId) {
          this.logger.warn(`Submission for user ${corrData.submissionUserEmail}, task ${corrData.submissionTaskTitle}, class ${corrData.submissionClassName} does not exist. Cannot create correction.`);
          continue;
        }

        const correctorId = this.userIdMap.get(corrData.correctorEmail);
        if (!correctorId) {
          this.logger.warn(`User (corrector) ${corrData.correctorEmail} does not exist. Cannot create correction.`);
          continue;
        }
        
        // Check if correction already exists for this submission and corrector
        // Note: Adjust this logic if multiple corrections per submission/corrector are allowed or if there's a unique constraint.
        const existingCorrection = await this.correctionModel.findOne({
          submissionId: new Types.ObjectId(submissionId),
          correctedById: new Types.ObjectId(correctorId), 
        });

        if (existingCorrection) {
          this.logger.log(`Correction for submission ${submissionId} by corrector ${corrData.correctorEmail} already exists.`);
          this.correctionIdMap.set(`${submissionId}-${corrData.correctorEmail}`, existingCorrection._id.toString());
          continue;
        }

        const newCorrection = await this.correctionModel.create({
          submissionId: new Types.ObjectId(submissionId),
          correctedById: new Types.ObjectId(correctorId),
          grade: corrData.grade,
          appreciation: corrData.appreciation,
          status: corrData.status || CorrectionStatus.COMPLETED,
          finalizedAt: corrData.correctedAt || new Date(),
          // Populate other fields as necessary from your Correction schema/DTO
        });
        
        this.correctionIdMap.set(`${submissionId}-${corrData.correctorEmail}`, newCorrection._id.toString());
        createdCount++;
        this.logger.log(`Correction successfully created for submission ${submissionId} by ${corrData.correctorEmail}`);
      } catch (error) {
        this.logger.error(`Error while creating correction for submission by ${corrData.submissionUserEmail} (corrector ${corrData.correctorEmail}):`, error);
      }
    }
    this.logger.log(`Corrections seeding completed. ${createdCount} corrections created.`);
  }

  private async seedAnnotations(annotations: AnnotationSeedData[]): Promise<void> {
    if (!annotations || annotations.length === 0) {
      this.logger.log('No annotations to create.');
      return;
    }

    let createdCount = 0;

    for (const annotationData of annotations) {
      try {
        // Convertir l'ID en chaîne pour la clé
        const annotationKey = String(annotationData.id);
        
        // Trouver l'ID de la correction associée
        const correctionLogicalId = String(annotationData.correctionId);
        const correctionKeys = Array.from(this.correctionIdMap.keys());
        const correctionKey = correctionKeys.find(key => key.includes(correctionLogicalId));
        
        if (!correctionKey) {
          this.logger.warn(`Correction with logical ID ${correctionLogicalId} not found. Cannot create annotation with ID ${annotationKey}.`);
          continue;
        }
        
        const correctionId = this.correctionIdMap.get(correctionKey);
        if (!correctionId) {
          this.logger.warn(`Correction with key ${correctionKey} not found. Cannot create annotation with ID ${annotationKey}.`);
          continue;
        }

        // Exclure seulement id et correctionId pour la sérialisation
        const { id, correctionId: _, ...annotationValueObj } = annotationData;
        
        // Sérialiser en JSON tous les autres champs dynamiques
        const annotationValue = JSON.stringify(annotationValueObj);
        
        // Créer l'annotation
        const newAnnotation = await this.annotationModel.create({
          key: annotationKey,
          value: annotationValue,
          correctionId: new Types.ObjectId(correctionId)
        });
        
        // Stocker l'ID pour les références futures
        this.annotationIdMap.set(annotationKey, newAnnotation._id.toString());
        
        createdCount++;
        this.logger.log(`Annotation successfully created with key ${annotationKey} for correction ${correctionId}`);
      } catch (error) {
        this.logger.error(`Error while creating annotation with ID ${annotationData.id}:`, error);
      }
    }
    
    this.logger.log(`Annotations seeding completed. ${createdCount} annotations created.`);
  }

  private async seedComments(comments: CommentSeedData[]): Promise<void> {
    if (!comments || comments.length === 0) {
      this.logger.log('No comments to create.');
      return;
    }

    let createdCount = 0;

    for (const commentData of comments) {
      try {
        // Trouver l'ID de la correction parente
        const submissionKey = `${commentData.submissionUserEmail}-${commentData.submissionTaskTitle}-${commentData.submissionClassName}`;
        const submissionId = this.submissionIdMap.get(submissionKey);
        if (!submissionId) {
          this.logger.warn(`Submission for key ${submissionKey} not found. Cannot create comment.`);
          continue;
        }

        const correctionKey = `${submissionId}-${commentData.correctorEmail}`;
        const correctionId = this.correctionIdMap.get(correctionKey);
        if (!correctionId) {
          this.logger.warn(`Correction for key ${correctionKey} not found. Cannot create comment.`);
          continue;
        }

        // Trouver l'ID de l'auteur du commentaire
        const authorId = this.userIdMap.get(commentData.authorEmail);
        if (!authorId) {
          this.logger.warn(`User (author) ${commentData.authorEmail} not found. Cannot create comment.`);
          continue;
        }

        // Convertir les IDs d'annotations logiques en IDs de base de données
        const annotationIds = [];
        if (commentData.annotations && commentData.annotations.length > 0) {
          for (const annotationLogicalId of commentData.annotations) {
            const annotationId = this.annotationIdMap.get(String(annotationLogicalId));
            if (annotationId) {
              annotationIds.push(annotationId);
            } else {
              this.logger.warn(`Annotation with logical ID ${annotationLogicalId} not found for comment.`);
            }
          }
        }

        // Créer le commentaire
        const newComment = await this.commentModel.create({
          correctionId: new Types.ObjectId(correctionId),
          createdBy: new Types.ObjectId(authorId),
          pageNumber: commentData.pageNumber,
          type: commentData.type,
          color: commentData.color,
          text: commentData.text,
          markdownSource: commentData.markdownSource,
          isMarkdown: commentData.isMarkdown,
          pageY: commentData.pageY,
          annotations: annotationIds.map(id => new Types.ObjectId(id)),
        });

        createdCount++;
        this.logger.log(`Comment successfully created on page ${commentData.pageNumber} for correction ${correctionId} by ${commentData.authorEmail}`);

      } catch (error) {
        this.logger.error(`Error while creating comment by ${commentData.authorEmail} on page ${commentData.pageNumber} for correction:`, error);
      }
    }
    this.logger.log(`Comments seeding completed. ${createdCount} comments created.`);
  }

  private async seedAIComments(aiComments: AICommentSeedData[]): Promise<void> {
    if (!aiComments || aiComments.length === 0) {
      this.logger.log('No AI comments to create.');
      return;
    }

    let createdCount = 0;

    for (const aiCommentData of aiComments) {
      try {
        // Trouver l'ID de la correction parente
        const submissionKey = `${aiCommentData.submissionUserEmail}-${aiCommentData.submissionTaskTitle}-${aiCommentData.submissionClassName}`;
        const submissionId = this.submissionIdMap.get(submissionKey);
        if (!submissionId) {
          this.logger.warn(`Submission for key ${submissionKey} not found. Cannot create AI comment.`);
          continue;
        }

        const correctionKey = `${submissionId}-${aiCommentData.correctorEmail}`;
        const correctionId = this.correctionIdMap.get(correctionKey);
        if (!correctionId) {
          this.logger.warn(`Correction for key ${correctionKey} not found. Cannot create AI comment.`);
          continue;
        }

        // Trouver l'ID de l'auteur du commentaire AI
        const authorId = this.userIdMap.get(aiCommentData.authorEmail);
        if (!authorId) {
          this.logger.warn(`User (author) ${aiCommentData.authorEmail} not found. Cannot create AI comment.`);
          continue;
        }

        // Convertir les IDs d'annotations logiques en IDs de base de données
        const annotationIds = [];
        if (aiCommentData.annotations && aiCommentData.annotations.length > 0) {
          for (const annotationLogicalId of aiCommentData.annotations) {
            const annotationId = this.annotationIdMap.get(String(annotationLogicalId));
            if (annotationId) {
              annotationIds.push(annotationId);
            } else {
              this.logger.warn(`Annotation with logical ID ${annotationLogicalId} not found for AI comment.`);
            }
          }
        }

        // Créer le commentaire AI
        const newAIComment = await this.aiCommentModel.create({
          correctionId: new Types.ObjectId(correctionId),
          createdBy: new Types.ObjectId(authorId),
          pageNumber: aiCommentData.pageNumber,
          type: aiCommentData.type,
          color: aiCommentData.color,
          text: aiCommentData.text,
          markdownSource: aiCommentData.markdownSource,
          isMarkdown: aiCommentData.isMarkdown,
          pageY: aiCommentData.pageY,
          annotations: annotationIds.map(id => new Types.ObjectId(id)),
        });

        createdCount++;
        this.logger.log(`AI Comment successfully created on page ${aiCommentData.pageNumber} for correction ${correctionId} by ${aiCommentData.authorEmail}`);

      } catch (error) {
        this.logger.error(`Error while creating AI comment by ${aiCommentData.authorEmail} on page ${aiCommentData.pageNumber} for correction:`, error);
      }
    }
    this.logger.log(`AI Comments seeding completed. ${createdCount} AI comments created.`);
  }
} 