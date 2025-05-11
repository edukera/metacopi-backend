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
import { AIAnnotation, AIAnnotationDocument } from '../../modules/ai-annotations/ai-annotation.schema';

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
  id: string;
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
  id: string;
  title: string;
  description?: string;
  classId?: string;
  className?: string; // Name of the class
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
  classId: string;
  role: MembershipRole;
  status?: MembershipStatus;
  isActive?: boolean;
}

export interface SubmissionSeedData {
  id: string;
  userEmail: string; // Email of the student
  taskId: string; // Identifiant logique de la tâche
  pages: any[]; // Tableau de pages (format {id, raw, processed})
  status?: SubmissionStatusEnum;
  submittedAt?: Date;
}

export interface CorrectionSeedData {
  id: string;
  submissionId: string;
  studentEmail: string;
  correctorEmail: string;
  grade?: number;
  appreciation?: string;
  status?: string;
  correctedAt?: Date;
}

export interface AnnotationSeedData {
  id: number | string;
  correctionId: number | string;
  pageId: string;
  createdByEmail: string;
  [key: string]: any;
}

export interface CommentSeedData {
  submissionId: string;
  correctionId: string;
  authorEmail: string;
  pageId: string;
  type: string;
  color: string;
  text: string;
  markdown: string;
  pageY: number;
  annotations: number[];
}

export interface AICommentSeedData {
  submissionId: string;
  correctionId: string;
  authorEmail: string;
  pageId: string;
  type: string;
  color: string;
  text: string;
  markdown?: string;
  pageY?: number;
  annotations?: number[];
}

export interface AIAnnotationSeedData {
  id: number | string;
  correctionId: number | string;
  pageId: string;
  createdByEmail: string;
  [key: string]: any;
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
  'ai-annotations': AIAnnotationSeedData[];
}

@Injectable()
export class DataSeedService {
  private readonly logger = new Logger(DataSeedService.name);
  private readonly userIdMap: Map<string, string> = new Map(); // Map email -> Mongo _id
  private readonly classIdMap: Map<string, string> = new Map(); // Map id logique -> Mongo _id
  private readonly taskIdMap: Map<string, string> = new Map(); // Map id logique -> Mongo _id
  private readonly submissionIdMap: Map<string, string> = new Map(); // Map id logique -> Mongo _id
  private readonly correctionIdMap: Map<string, string> = new Map(); // Map id logique -> Mongo _id
  private readonly annotationIdMap: Map<string, string> = new Map(); // Map id logique -> Mongo _id
  private readonly aiAnnotationIdMap: Map<string, string> = new Map();

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
    @InjectModel(AIAnnotation.name) private aiAnnotationModel: Model<AIAnnotationDocument>,
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
      await this.seedAIAnnotations(seedData['ai-annotations']);
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
        // Recherche par id logique
        const existingClass = await this.classModel.findOne({ id: classData.id });
        if (existingClass) {
          this.logger.log(`Class ${classData.id} already exists.`);
          this.classIdMap.set(classData.id, existingClass._id.toString());
          continue;
        }
        // Vérifier que le créateur existe
        const createdById = this.userIdMap.get(classData.createdBy);
        if (!createdById) {
          this.logger.warn(`User ${classData.createdBy} does not exist. Cannot create class ${classData.id}.`);
          continue;
        }
        // Création de la classe avec l'email du créateur
        const newClass = await this.classModel.create({
          id: classData.id,
          name: classData.name,
          description: classData.description,
          code: classData.code,
          settings: classData.settings || {},
          startDate: classData.startDate,
          endDate: classData.endDate,
          archived: classData.archived || false,
          createdByEmail: classData.createdBy, // on passe l'email ici
        });
        this.classIdMap.set(classData.id, newClass._id.toString());
        createdCount++;
        this.logger.log(`Class successfully created: ${classData.id}`);
      } catch (error) {
        this.logger.error(`Error while creating class ${classData.id}:`, error);
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
        // Harmonisation classId/className
        let classId = taskData.classId;
        if (!classId && taskData.className) {
          // On cherche l'id logique de la classe à partir du nom
          const foundClass = Array.from(this.classIdMap.entries()).find(([logicId, _]) => {
            // On suppose que le nom de la classe est unique
            return logicId === taskData.className;
          });
          if (foundClass) classId = foundClass[0];
        }
        if (!classId) {
          this.logger.warn(`Class for task ${taskData.id || taskData.title} not found. Cannot create task.`);
          continue;
        }
        // Créateur par email
        const createdById = this.userIdMap.get(taskData.createdBy);
        if (!createdById) {
          this.logger.warn(`User ${taskData.createdBy} does not exist. Cannot create task ${taskData.id || taskData.title}.`);
          continue;
        }
        // Recherche par id logique
        const existingTask = await this.taskModel.findOne({ id: taskData.id });
        if (existingTask) {
          this.logger.log(`Task ${taskData.id} already exists.`);
          this.taskIdMap.set(taskData.id, existingTask._id.toString());
          continue;
        }
        // Création de la tâche avec id logique
        const newTask = await this.taskModel.create({
          id: taskData.id,
          title: taskData.title,
          description: taskData.description,
          classId: classId,
          createdByEmail: taskData.createdBy,
          status: taskData.status || TaskStatus.DRAFT,
          dueDate: taskData.dueDate,
          points: taskData.points || 0,
          tags: taskData.tags || [],
          metadata: taskData.metadata || {},
          settings: taskData.settings || {},
        });
        this.taskIdMap.set(taskData.id, newTask._id.toString());
        createdCount++;
        this.logger.log(`Task successfully created: ${taskData.id}`);
      } catch (error) {
        this.logger.error(`Error while creating task ${taskData.id}:`, error);
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
        const classId = this.classIdMap.get(membershipData.classId);
        if (!classId) {
          this.logger.warn(`Class ${membershipData.classId} does not exist. Cannot create membership.`);
          continue;
        }
        
        // Check if the membership already exists
        const existingMembership = await this.membershipModel.findOne({
          userId: new Types.ObjectId(userId),
          classId: new Types.ObjectId(classId),
        });
        
        if (existingMembership) {
          this.logger.log(`Membership for ${membershipData.userEmail} in class ${membershipData.classId} already exists.`);
          continue;
        }
        
        // Create the new membership
        await this.membershipModel.create({
          email: membershipData.userEmail,
          classId: membershipData.classId,
          role: membershipData.role,
          status: membershipData.status || MembershipStatus.ACTIVE,
          isActive: membershipData.isActive !== undefined ? membershipData.isActive : true,
          joinedAt: new Date(),
        });
        
        createdCount++;
        this.logger.log(`Membership successfully created: ${membershipData.userEmail} (${membershipData.role}) in class ${membershipData.classId}`);
      } catch (error) {
        this.logger.error(`Error while creating membership for ${membershipData.userEmail} in class ${membershipData.classId}:`, error);
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
        // Trouver l'étudiant par email
        const studentId = this.userIdMap.get(subData.userEmail);
        if (!studentId) {
          this.logger.warn(`User (student) ${subData.userEmail} does not exist. Cannot create submission ${subData.id}.`);
          continue;
        }
        // Trouver la tâche par id logique
        const taskMongoId = this.taskIdMap.get(subData.taskId);
        if (!taskMongoId) {
          this.logger.warn(`Task ${subData.taskId} does not exist. Cannot create submission ${subData.id}.`);
          continue;
        }
        // Recherche par id logique
        const existingSubmission = await this.submissionModel.findOne({ id: subData.id });
        if (existingSubmission) {
          this.logger.log(`Submission ${subData.id} already exists.`);
          this.submissionIdMap.set(subData.id, existingSubmission._id.toString());
          continue;
        }
        // Création de la soumission avec id logique et pages
        const newSubmission = await this.submissionModel.create({
          id: subData.id,
          studentEmail: subData.userEmail,
          taskId: subData.taskId,
          uploadedByEmail: subData.userEmail,
          pages: subData.pages,
          status: subData.status || SubmissionStatusEnum.DRAFT,
          submittedAt: subData.submittedAt,
        });
        this.submissionIdMap.set(subData.id, newSubmission._id.toString());
        createdCount++;
        this.logger.log(`Submission successfully created: ${subData.id}`);
      } catch (error) {
        this.logger.error(`Error while creating submission ${subData.id}:`, error);
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
        // Trouver la soumission par id logique
        const submissionMongoId = this.submissionIdMap.get(corrData.submissionId);
        if (!submissionMongoId) {
          this.logger.warn(`Submission ${corrData.submissionId} does not exist. Cannot create correction ${corrData.id}.`);
          continue;
        }
        // Trouver le correcteur par email
        const correctorId = this.userIdMap.get(corrData.correctorEmail);
        if (!correctorId) {
          this.logger.warn(`User (corrector) ${corrData.correctorEmail} does not exist. Cannot create correction ${corrData.id}.`);
          continue;
        }
        // Recherche par id logique
        const existingCorrection = await this.correctionModel.findOne({ id: corrData.id });
        if (existingCorrection) {
          this.logger.log(`Correction ${corrData.id} already exists.`);
          this.correctionIdMap.set(corrData.id, existingCorrection._id.toString());
          continue;
        }
        // Création de la correction avec id logique (sans annotations)
        const newCorrection = await this.correctionModel.create({
          id: corrData.id,
          submissionId: corrData.submissionId,
          studentEmail: corrData.studentEmail,
          correctedByEmail: corrData.correctorEmail,
          grade: corrData.grade,
          appreciation: corrData.appreciation,
          status: corrData.status || CorrectionStatus.COMPLETED,
          finalizedAt: corrData.correctedAt || new Date(),
        });
        this.correctionIdMap.set(corrData.id, newCorrection._id.toString());
        createdCount++;
        this.logger.log(`Correction successfully created: ${corrData.id}`);
      } catch (error) {
        this.logger.error(`Error while creating correction ${corrData.id}:`, error);
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
        // On suppose que correctionId est déjà l'id logique
        const correctionMongoId = this.correctionIdMap.get(annotationData.correctionId as string);
        if (!correctionMongoId) {
          this.logger.warn(`Correction ${annotationData.correctionId} does not exist. Cannot create annotation ${annotationData.id}.`);
          continue;
        }
        // On extrait les champs à la racine et on sérialise le reste dans 'value'
        const { id, correctionId, createdByEmail, pageId, ...rest } = annotationData;
        const value = JSON.stringify(rest);
        const newAnnotation = await this.annotationModel.create({
          id: String(id),
          correctionId,
          createdByEmail,
          pageId,
          value,
        });
        this.annotationIdMap.set(String(id), newAnnotation._id.toString());
        createdCount++;
        this.logger.log(`Annotation successfully created: ${id}`);
      } catch (error) {
        this.logger.error(`Error while creating annotation with ID ${annotationData.id}:`, error);
      }
    }
    this.logger.log(`Annotations seeding completed. ${createdCount} annotations created.`);
  }

  private async seedAIAnnotations(aiAnnotations: AIAnnotationSeedData[]): Promise<void> {
    if (!aiAnnotations || aiAnnotations.length === 0) {
      this.logger.log('No AI annotations to create.');
      return;
    }
    let createdCount = 0;
    for (const aiAnnotationData of aiAnnotations) {
      try {
        // On suppose que correctionId est déjà l'id logique
        const correctionMongoId = this.correctionIdMap.get(aiAnnotationData.correctionId as string);
        if (!correctionMongoId) {
          this.logger.warn(`Correction ${aiAnnotationData.correctionId} does not exist. Cannot create AI annotation ${aiAnnotationData.id}.`);
          continue;
        }
        // On extrait les champs à la racine et on sérialise le reste dans 'value'
        const { id, correctionId, createdByEmail, pageId, ...rest } = aiAnnotationData;
        const value = JSON.stringify(rest);
        const newAIAnnotation = await this.aiAnnotationModel.create({
          id: String(id),
          correctionId,
          createdByEmail,
          pageId,
          value,
        });
        this.aiAnnotationIdMap.set(String(id), newAIAnnotation._id.toString());
        createdCount++;
        this.logger.log(`AI Annotation successfully created: ${id}`);
      } catch (error) {
        this.logger.error(`Error while creating AI annotation with ID ${aiAnnotationData.id}:`, error);
      }
    }
    this.logger.log(`AI Annotations seeding completed. ${createdCount} AI annotations created.`);
  }

  private async seedComments(comments: CommentSeedData[]): Promise<void> {
    if (!comments || comments.length === 0) {
      this.logger.log('No comments to create.');
      return;
    }
    let createdCount = 0;
    for (const commentData of comments) {
      try {
        // Trouver la correction par id logique
        const correctionMongoId = this.correctionIdMap.get(commentData.correctionId);
        if (!correctionMongoId) {
          this.logger.warn(`Correction ${commentData.correctionId} does not exist. Cannot create comment.`);
          continue;
        }
        // Trouver l'auteur
        const authorId = this.userIdMap.get(commentData.authorEmail);
        if (!authorId) {
          this.logger.warn(`User (author) ${commentData.authorEmail} not found. Cannot create comment.`);
          continue;
        }
        // Stocker directement les ids logiques d'annotations
        const newComment = await this.commentModel.create({
          ...commentData,
          correctionId: commentData.correctionId,
          createdByEmail: commentData.authorEmail,
          annotations: commentData.annotations || [],
          pageId: commentData.pageId,
        });
        createdCount++;
        this.logger.log(`Comment successfully created on page ${commentData.pageId} for correction ${commentData.correctionId} by ${commentData.authorEmail}`);
      } catch (error) {
        this.logger.error(`Error while creating comment by ${commentData.authorEmail} on page ${commentData.pageId} for correction:`, error);
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
        // Trouver la correction par id logique
        const correctionMongoId = this.correctionIdMap.get(aiCommentData.correctionId);
        if (!correctionMongoId) {
          this.logger.warn(`Correction ${aiCommentData.correctionId} does not exist. Cannot create AI comment.`);
          continue;
        }
        // Trouver l'auteur
        const authorId = this.userIdMap.get(aiCommentData.authorEmail);
        if (!authorId) {
          this.logger.warn(`User (author) ${aiCommentData.authorEmail} not found. Cannot create AI comment.`);
          continue;
        }
        // Stocker directement les ids logiques d'annotations
        const newAIComment = await this.aiCommentModel.create({
          ...aiCommentData,
          correctionId: aiCommentData.correctionId,
          createdByEmail: aiCommentData.authorEmail,
          annotations: aiCommentData.annotations || [],
          pageId: aiCommentData.pageId,
        });
        createdCount++;
        this.logger.log(`AI Comment successfully created on page ${aiCommentData.pageId} for correction ${aiCommentData.correctionId} by ${aiCommentData.authorEmail}`);
      } catch (error) {
        this.logger.error(`Error while creating AI comment by ${aiCommentData.authorEmail} on page ${aiCommentData.pageId} for correction:`, error);
      }
    }
    this.logger.log(`AI Comments seeding completed. ${createdCount} AI comments created.`);
  }
} 