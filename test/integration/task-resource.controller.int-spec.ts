import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, connect, Model, Types } from 'mongoose';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { BadRequestException, NotFoundException, HttpStatus } from '@nestjs/common';

import { TaskResourceController } from '../../src/modules/task-resources/task-resource.controller';
import { TaskResourceService } from '../../src/modules/task-resources/task-resource.service';
import { TaskResource, TaskResourceSchema, ResourceType } from '../../src/modules/task-resources/task-resource.schema';
import { Task, TaskSchema, TaskStatus } from '../../src/modules/tasks/task.schema';
import { Class, ClassSchema } from '../../src/modules/classes/class.schema';
import { User, UserSchema, UserRole } from '../../src/modules/users/user.schema';
import { Membership, MembershipRole, MembershipSchema } from '../../src/modules/memberships/membership.schema';
import { MembershipService } from '../../src/modules/memberships/membership.service';
import { TaskService } from '../../src/modules/tasks/task.service';
import { SubmissionService } from '../../src/modules/submissions/submission.service';
import { Submission, SubmissionSchema } from '../../src/modules/submissions/submission.schema';
import { CreateTaskResourceDto, UpdateTaskResourceDto } from '../../src/modules/task-resources/task-resource.dto';
import { TestDataHelper } from '../helpers/test-data.helper';
import { AuditLog, AuditLogSchema } from '../../src/modules/audit-logs/audit-log.schema';
import { CorrectionService } from '../../src/modules/corrections/correction.service';
import { Correction, CorrectionSchema } from '../../src/modules/corrections/correction.schema';
import { CorrectionModule } from '../../src/modules/corrections/correction.module';
import { CorrectionStatusTransitionValidator } from '../../src/modules/corrections/validators/correction-status-transition.validator';

// Increase timeout for all tests
jest.setTimeout(30000);

describe('TaskResourceController (Integration)', () => {
  let taskResourceController: TaskResourceController;
  let taskResourceService: TaskResourceService;
  let testDataHelper: TestDataHelper;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  let taskModel: Model<Task>;
  let userModel: Model<User>;
  let classModel: Model<Class>;
  let membershipModel: Model<Membership>;
  let taskResourceModel: Model<TaskResource>;
  let moduleRef: TestingModule;

  // Reusable test data
  let teacher;
  let student;
  let classEntity;
  let task;
  let teacherMembership;
  let studentMembership;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoConnection = (await connect(uri)).connection;

    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([
          { name: Task.name, schema: TaskSchema },
          { name: Class.name, schema: ClassSchema },
          { name: User.name, schema: UserSchema },
          { name: Membership.name, schema: MembershipSchema },
          { name: TaskResource.name, schema: TaskResourceSchema },
          { name: Submission.name, schema: SubmissionSchema },
          { name: AuditLog.name, schema: AuditLogSchema },
          { name: Correction.name, schema: CorrectionSchema },
        ]),
        CorrectionModule,
      ],
      controllers: [TaskResourceController],
      providers: [
        TaskResourceService,
        TaskService,
        MembershipService,
        SubmissionService,
        CorrectionService,
        CorrectionStatusTransitionValidator,
        TestDataHelper,
        {
          provide: 'REQUEST',
          useFactory: () => ({
            user: { sub: '' } // Will be updated in each test
          }),
        },
      ],
    }).compile();

    taskResourceController = moduleRef.get<TaskResourceController>(TaskResourceController);
    taskResourceService = moduleRef.get<TaskResourceService>(TaskResourceService);
    testDataHelper = moduleRef.get<TestDataHelper>(TestDataHelper);
    
    taskModel = mongoConnection.model(Task.name, TaskSchema);
    userModel = mongoConnection.model(User.name, UserSchema);
    classModel = mongoConnection.model(Class.name, ClassSchema);
    membershipModel = mongoConnection.model(Membership.name, MembershipSchema);
    taskResourceModel = mongoConnection.model(TaskResource.name, TaskResourceSchema);
  });

  afterAll(async () => {
    try {
      if (moduleRef) {
        await moduleRef.close();
      }
      
      if (mongoConnection) {
        await mongoConnection.dropDatabase();
        await mongoConnection.close(true);
      }
      
      if (mongod) {
        await mongod.stop();
      }
      
      // Force GC to free resources
      if (global.gc) {
        global.gc();
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  });

  beforeEach(async () => {
    await testDataHelper.cleanDatabase();
    
    // Create a teacher, a class and membership
    const { teacher: createdTeacher, class: createdClass, membership: createdTeacherMembership } = 
      await testDataHelper.createTeacherWithClass(
        { firstName: 'Prof', lastName: 'Test', email: 'teacher@test.com', role: UserRole.ADMIN },
        { name: 'Test class', description: 'A class for tests' }
      );
    
    teacher = createdTeacher;
    classEntity = createdClass;
    teacherMembership = createdTeacherMembership;
    
    // Create a student and their membership
    const { student: createdStudent, membership: createdStudentMembership } = 
      await testDataHelper.createStudentInClass(
        classEntity._id,
        { firstName: 'Student', lastName: 'Test', email: 'student@test.com', role: UserRole.USER }
      );
    
    student = createdStudent;
    studentMembership = createdStudentMembership;
    
    // Create a task for tests
    task = await testDataHelper.createTask({
      classId: classEntity._id.toString(),
      createdBy: teacher.id,
      title: 'Task with resources',
      status: TaskStatus.PUBLISHED
    });
    
    // Configure the user as the teacher by default
    const request = moduleRef.get('REQUEST');
    request.user.sub = teacher.id;
    
    // Reset mocks after each test
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('POST /task-resources', () => {
    it('should create a new task resource', async () => {
      const createTaskResourceDto: CreateTaskResourceDto = {
        name: 'PDF Document',
        description: 'A PDF document containing instructions',
        taskId: task._id.toString(),
        type: ResourceType.FILE,
        filePath: 'tasks/resources/document.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024 * 100, // 100KB
        isRequired: true,
        order: 1
      };
      
      const result = await taskResourceController.create(createTaskResourceDto);
      
      expect(result).toBeDefined();
      expect(result.name).toBe(createTaskResourceDto.name);
      expect(result.description).toBe(createTaskResourceDto.description);
      expect(result.taskId.toString()).toBe(task._id.toString());
      expect(result.type).toBe(ResourceType.FILE);
      expect(result.filePath).toBe(createTaskResourceDto.filePath);
      expect(result.mimeType).toBe(createTaskResourceDto.mimeType);
      expect(result.fileSize).toBe(createTaskResourceDto.fileSize);
      expect(result.isRequired).toBe(createTaskResourceDto.isRequired);
      expect(result.order).toBeDefined();
      
      // Verify that the resource has been saved in the database
      const savedResource = await taskResourceModel.findById(result._id);
      expect(savedResource).toBeDefined();
      expect(savedResource.name).toBe(createTaskResourceDto.name);
    });
    
    it('should create a text resource', async () => {
      const createTaskResourceDto: CreateTaskResourceDto = {
        name: 'Instructions',
        description: 'Task instructions',
        taskId: task._id.toString(),
        type: ResourceType.TEXT,
        content: 'Here are the detailed instructions to complete this task...',
        isRequired: true,
        order: 0
      };
      
      const result = await taskResourceController.create(createTaskResourceDto);
      
      expect(result).toBeDefined();
      expect(result.type).toBe(ResourceType.TEXT);
      expect(result.content).toBe(createTaskResourceDto.content);
    });
    
    it('should create a link resource', async () => {
      const createTaskResourceDto: CreateTaskResourceDto = {
        name: 'Documentation link',
        taskId: task._id.toString(),
        type: ResourceType.LINK,
        url: 'https://example.com/docs',
        order: 2
      };
      
      const result = await taskResourceController.create(createTaskResourceDto);
      
      expect(result).toBeDefined();
      expect(result.type).toBe(ResourceType.LINK);
      expect(result.url).toBe(createTaskResourceDto.url);
    });
  });
  
  describe('GET /task-resources', () => {
    it('should return all task resources', async () => {
      // Create multiple resources
      await taskResourceModel.create({
        name: 'Resource 1',
        taskId: task._id,
        type: ResourceType.TEXT,
        content: 'Text content',
        order: 0
      });
      
      await taskResourceModel.create({
        name: 'Resource 2',
        taskId: task._id,
        type: ResourceType.LINK,
        url: 'https://example.com',
        order: 1
      });
      
      const resources = await taskResourceController.findAll();
      
      expect(resources).toBeDefined();
      expect(Array.isArray(resources)).toBe(true);
      expect(resources.length).toBe(2);
    });
  });
  
  describe('GET /task-resources/task/:taskId', () => {
    it('should return resources for a specific task', async () => {
      // Create resources for the task
      await taskResourceModel.create({
        name: 'Task 1 resource',
        taskId: task._id,
        type: ResourceType.TEXT,
        content: 'Text content',
        order: 0
      });
      
      await taskResourceModel.create({
        name: 'Task 1 resource (2)',
        taskId: task._id,
        type: ResourceType.LINK,
        url: 'https://example.com',
        order: 1
      });
      
      // Create another task and resource
      const otherTask = await testDataHelper.createTask({
        classId: classEntity._id.toString(),
        createdBy: teacher.id,
        title: 'Other task',
        status: TaskStatus.PUBLISHED
      });
      
      await taskResourceModel.create({
        name: 'Other task resource',
        taskId: otherTask._id,
        type: ResourceType.TEXT,
        content: 'Other content',
        order: 0
      });
      
      const resources = await taskResourceController.findByTask(task._id.toString());
      
      expect(resources).toBeDefined();
      expect(Array.isArray(resources)).toBe(true);
      expect(resources.length).toBe(2);
      expect(resources[0].taskId.toString()).toBe(task._id.toString());
      expect(resources[1].taskId.toString()).toBe(task._id.toString());
    });
  });
  
  describe('GET /task-resources/:id', () => {
    it('should return a task resource by id', async () => {
      const resource = await taskResourceModel.create({
        name: 'Resource to retrieve',
        taskId: task._id,
        type: ResourceType.TEXT,
        content: 'Content to retrieve',
        order: 0
      });
      
      const result = await taskResourceController.findOne(resource._id.toString());
      
      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(resource._id.toString());
      expect(result.name).toBe('Resource to retrieve');
      expect(result.content).toBe('Content to retrieve');
    });
    
    it('should throw NotFoundException for non-existent resource', async () => {
      const nonExistentId = new Types.ObjectId().toString();
      
      await expect(taskResourceController.findOne(nonExistentId))
        .rejects.toThrow(NotFoundException);
    });
  });
  
  describe('PATCH /task-resources/:id', () => {
    it('should update a task resource', async () => {
      const resource = await taskResourceModel.create({
        name: 'Resource before update',
        taskId: task._id,
        type: ResourceType.TEXT,
        content: 'Content before update',
        isRequired: false,
        order: 0
      });
      
      const updateTaskResourceDto: UpdateTaskResourceDto = {
        name: 'Resource after update',
        content: 'Content after update',
        isRequired: true
      };
      
      const result = await taskResourceController.update(resource._id.toString(), updateTaskResourceDto);
      
      expect(result).toBeDefined();
      expect(result.name).toBe(updateTaskResourceDto.name);
      expect(result.content).toBe(updateTaskResourceDto.content);
      expect(result.isRequired).toBe(updateTaskResourceDto.isRequired);
      
      // Verify that non-modified fields are preserved
      expect(result.type).toBe(ResourceType.TEXT);
      expect(result.taskId.toString()).toBe(task._id.toString());
      expect(result.order).toBe(0);
      
      // Verify that the resource has been updated in the database
      const updatedResource = await taskResourceModel.findById(resource._id);
      expect(updatedResource).toBeDefined();
      expect(updatedResource.name).toBe(updateTaskResourceDto.name);
    });
  });
  
  describe('DELETE /task-resources/:id', () => {
    it('should delete a task resource', async () => {
      const resource = await taskResourceModel.create({
        name: 'Resource to delete',
        taskId: task._id,
        type: ResourceType.TEXT,
        content: 'Content to delete',
        order: 0
      });
      
      await taskResourceController.remove(resource._id.toString());
      
      // Verify that the resource has been deleted
      const deletedResource = await taskResourceModel.findById(resource._id);
      expect(deletedResource).toBeNull();
    });
  });
  
  describe('POST /task-resources/reorder/:taskId', () => {
    it('should reorder task resources', async () => {
      // Create multiple resources with different orders
      const resource1 = await taskResourceModel.create({
        name: 'Resource 1',
        taskId: task._id,
        type: ResourceType.TEXT,
        content: 'Content 1',
        order: 0
      });
      
      const resource2 = await taskResourceModel.create({
        name: 'Resource 2',
        taskId: task._id,
        type: ResourceType.LINK,
        url: 'https://example.com',
        order: 1
      });
      
      const resource3 = await taskResourceModel.create({
        name: 'Resource 3',
        taskId: task._id,
        type: ResourceType.FILE,
        filePath: 'path/to/file.pdf',
        order: 2
      });
      
      // Reorder resources (3, 1, 2)
      const resourceIds = [
        resource3._id.toString(),
        resource1._id.toString(),
        resource2._id.toString()
      ];
      
      const result = await taskResourceController.reorder(task._id.toString(), resourceIds);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
      
      // Verify the order of returned resources
      expect(result[0]._id.toString()).toBe(resource3._id.toString());
      expect(result[0].order).toBe(0);
      
      expect(result[1]._id.toString()).toBe(resource1._id.toString());
      expect(result[1].order).toBe(1);
      
      expect(result[2]._id.toString()).toBe(resource2._id.toString());
      expect(result[2].order).toBe(2);
      
      // Verify that the order has been updated in the database
      const updatedResource1 = await taskResourceModel.findById(resource1._id);
      const updatedResource2 = await taskResourceModel.findById(resource2._id);
      const updatedResource3 = await taskResourceModel.findById(resource3._id);
      
      expect(updatedResource1.order).toBe(1);
      expect(updatedResource2.order).toBe(2);
      expect(updatedResource3.order).toBe(0);
    });
  });
}); 