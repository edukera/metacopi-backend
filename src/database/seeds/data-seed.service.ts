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

// Interfaces to define the JSON structure
export interface UserSeedData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
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

export interface SeedData {
  users: UserSeedData[];
  classes: ClassSeedData[];
  tasks: TaskSeedData[];
  memberships: MembershipSeedData[];
}

@Injectable()
export class DataSeedService {
  private readonly logger = new Logger(DataSeedService.name);
  private readonly userIdMap: Map<string, string> = new Map(); // Map email -> userId
  private readonly classIdMap: Map<string, string> = new Map(); // Map name -> classId

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Class.name) private classModel: Model<Class>,
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(Membership.name) private membershipModel: Model<Membership>,
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
          continue;
        }
        
        // Create the new task
        await this.taskModel.create({
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
} 