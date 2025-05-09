import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, connect, Model, Types } from 'mongoose';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { REQUEST } from '@nestjs/core';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { TaskController } from '../../src/modules/tasks/task.controller';
import { TaskService } from '../../src/modules/tasks/task.service';
import { Task, TaskSchema, TaskStatus } from '../../src/modules/tasks/task.schema';
import { Class, ClassSchema } from '../../src/modules/classes/class.schema';
import { User, UserSchema, UserRole } from '../../src/modules/users/user.schema';
import { Membership, MembershipRole, MembershipSchema } from '../../src/modules/memberships/membership.schema';
import { Submission, SubmissionSchema } from '../../src/modules/submissions/submission.schema';
import { Correction, CorrectionSchema } from '../../src/modules/corrections/correction.schema';
import { MembershipService } from '../../src/modules/memberships/membership.service';
import { SubmissionService } from '../../src/modules/submissions/submission.service';
import { CorrectionService } from '../../src/modules/corrections/correction.service';
import { CreateTaskDto, UpdateTaskDto } from '../../src/modules/tasks/task.dto';

// Increase timeout for all tests
jest.setTimeout(60000);

describe('TaskController (Isolated Integration)', () => {
  let taskController: TaskController;
  let taskService: TaskService;
  let membershipService: MembershipService;
  let submissionService: SubmissionService;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  let taskModel: Model<Task>;
  let userModel: Model<User>;
  let classModel: Model<Class>;
  let membershipModel: Model<Membership>;
  let submissionModel: Model<Submission>;
  let correctionModel: Model<Correction>;
  let moduleRef: TestingModule;
  
  // Test data
  let testTeacher: any;
  let testStudent: any;
  let testClass: any;
  
  // Mock request object
  const mockRequest = {
    user: {
      sub: 'test-user-id' // Will be updated in tests
    }
  };

  beforeAll(async () => {
    console.log('Starting isolated integration tests for TaskController...');
    
    // Create in-memory MongoDB database
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoConnection = (await connect(uri)).connection;

    // Configure test module
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
          { name: Submission.name, schema: SubmissionSchema },
          { name: Correction.name, schema: CorrectionSchema },
        ]),
      ],
      controllers: [TaskController],
      providers: [
        TaskService,
        MembershipService,
        {
          provide: SubmissionService,
          useValue: {
            removeByTask: jest.fn().mockImplementation(() => Promise.resolve()),
            findByTask: jest.fn().mockImplementation(() => Promise.resolve([])),
          }
        },
        {
          provide: CorrectionService,
          useValue: {
            findByTask: jest.fn().mockImplementation(() => Promise.resolve([])),
          }
        },
        {
          provide: REQUEST,
          useValue: mockRequest
        },
      ],
    }).compile();

    // Get controller and service instances
    taskController = moduleRef.get<TaskController>(TaskController);
    taskService = moduleRef.get<TaskService>(TaskService);
    membershipService = moduleRef.get<MembershipService>(MembershipService);
    submissionService = moduleRef.get<SubmissionService>(SubmissionService);
    
    // Get Mongoose models
    taskModel = mongoConnection.model(Task.name, TaskSchema);
    userModel = mongoConnection.model(User.name, UserSchema);
    classModel = mongoConnection.model(Class.name, ClassSchema);
    membershipModel = mongoConnection.model(Membership.name, MembershipSchema);
    submissionModel = mongoConnection.model(Submission.name, SubmissionSchema);
    correctionModel = mongoConnection.model(Correction.name, CorrectionSchema);
    
    console.log('Setup complete');
  });

  afterAll(async () => {
    console.log('Cleaning up after tests...');
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
      
      console.log('Cleanup complete');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  });

  beforeEach(async () => {
    console.log('Preparing test data...');
    
    // Clean collections
    await taskModel.deleteMany({});
    await userModel.deleteMany({});
    await classModel.deleteMany({});
    await membershipModel.deleteMany({});
    await submissionModel.deleteMany({});
    await correctionModel.deleteMany({});
    
    // Create test teacher
    testTeacher = await userModel.create({
      firstName: 'Teacher',
      lastName: 'Test',
      email: 'teacher@test.com',
      password: 'password123',
      role: UserRole.ADMIN,
    });
    
    // Create test student
    testStudent = await userModel.create({
      firstName: 'Student',
      lastName: 'Test',
      email: 'student@test.com',
      password: 'password123',
      role: UserRole.USER,
    });
    
    // Create test class
    testClass = await classModel.create({
      name: 'Test Class',
      description: 'Class for testing',
      createdBy: testTeacher._id,
    });
    
    // Create teacher membership
    await membershipModel.create({
      userId: testTeacher._id,
      classId: testClass._id,
      role: MembershipRole.TEACHER,
      status: 'active',
      isActive: true,
    });
    
    // Create student membership
    await membershipModel.create({
      userId: testStudent._id,
      classId: testClass._id,
      role: MembershipRole.STUDENT,
      status: 'active',
      isActive: true,
    });
    
    // Set teacher as default user in request
    mockRequest.user.sub = testTeacher._id.toString();
    
    // Setup mock implementations
    jest.spyOn(membershipService, 'findByUserAndClass').mockImplementation(
      async (userId, classId) => {
        const membership = await membershipModel.findOne({ 
          userId: new Types.ObjectId(userId), 
          classId: new Types.ObjectId(classId)
        });
        return membership;
      }
    );
    
    jest.spyOn(membershipService, 'findByUser').mockImplementation(
      async (userId) => {
        const memberships = await membershipModel.find({ 
          userId: new Types.ObjectId(userId)
        });
        return memberships;
      }
    );
    
    console.log('Test data prepared');
  });

  it('should be defined', () => {
    expect(taskController).toBeDefined();
    expect(taskService).toBeDefined();
  });

  it('should create a task', async () => {
    console.log('Testing task creation...');
    
    const createTaskDto: CreateTaskDto = {
      title: 'Test Assignment',
      description: 'A description for the test assignment',
      classId: testClass._id.toString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      status: TaskStatus.DRAFT,
    };
    
    const result = await taskController.create(createTaskDto);
    
    expect(result).toBeDefined();
    expect(result.title).toBe(createTaskDto.title);
    expect(result.description).toBe(createTaskDto.description);
    expect(result.classId.toString()).toBe(createTaskDto.classId);
    expect(result.status).toBe(TaskStatus.DRAFT);
    expect(result.createdBy.toString()).toBe(testTeacher._id.toString());
    
    // Verify it was saved to database
    const savedTask = await taskModel.findById(result.id);
    expect(savedTask).toBeDefined();
    expect(savedTask.title).toBe(createTaskDto.title);
    
    console.log('Test completed successfully');
  });

  it('should find tasks by classId', async () => {
    console.log('Testing finding tasks by classId...');
    
    // Create a second class
    const class2 = await classModel.create({
      name: 'Second Class',
      description: 'Another class for testing',
      createdBy: testTeacher._id,
    });
    
    // Create tasks in different classes
    const task1 = await taskModel.create({
      title: 'Task in Class 1',
      description: 'Description for task in class 1',
      classId: testClass._id,
      status: TaskStatus.PUBLISHED,
      createdBy: testTeacher._id,
    });
    
    const task2 = await taskModel.create({
      title: 'Task in Class 2',
      description: 'Description for task in class 2',
      classId: class2._id,
      status: TaskStatus.PUBLISHED,
      createdBy: testTeacher._id,
    });
    
    // Find tasks for the first class
    const tasks = await taskController.findAll(testClass._id.toString());
    
    expect(tasks).toBeDefined();
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.length).toBe(1);
    expect(tasks[0].id.toString()).toBe(task1._id.toString());
    expect(tasks[0].title).toBe('Task in Class 1');
    
    console.log('Test completed successfully');
  });

  it('should get a task by id', async () => {
    console.log('Testing finding a task by ID...');
    
    const task = await taskModel.create({
      title: 'Find This Task',
      description: 'Task to be found by ID',
      classId: testClass._id,
      status: TaskStatus.PUBLISHED,
      createdBy: testTeacher._id,
    });
    
    const result = await taskController.findOne(task._id.toString());
    
    expect(result).toBeDefined();
    expect(result.id.toString()).toBe(task._id.toString());
    expect(result.title).toBe('Find This Task');
    
    console.log('Test completed successfully');
  });

  it('should throw error for non-existent task', async () => {
    console.log('Testing error for non-existent task...');
    
    const nonExistentId = new Types.ObjectId().toString();
    
    // Mock the taskService.findOne method to throw NotFoundException
    jest.spyOn(taskService, 'findOne').mockImplementation(async (id) => {
      if (id === nonExistentId) {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }
      return null;
    });
    
    await expect(taskController.findOne(nonExistentId))
      .rejects.toThrow(NotFoundException);
    
    console.log('Test completed successfully');
  });
}); 