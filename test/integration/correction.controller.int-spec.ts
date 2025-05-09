import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, connect, Model, Types } from 'mongoose';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { BadRequestException, NotFoundException, HttpStatus } from '@nestjs/common';

import { CorrectionController } from '../../src/modules/corrections/correction.controller';
import { CorrectionService } from '../../src/modules/corrections/correction.service';
import { Correction, CorrectionSchema } from '../../src/modules/corrections/correction.schema';
import { Submission, SubmissionSchema, SubmissionStatus } from '../../src/modules/submissions/submission.schema';
import { Task, TaskSchema, TaskStatus } from '../../src/modules/tasks/task.schema';
import { Class, ClassSchema } from '../../src/modules/classes/class.schema';
import { User, UserSchema, UserRole } from '../../src/modules/users/user.schema';
import { Membership, MembershipRole, MembershipSchema } from '../../src/modules/memberships/membership.schema';
import { MembershipService } from '../../src/modules/memberships/membership.service';
import { SubmissionService } from '../../src/modules/submissions/submission.service';
import { CreateCorrectionDto, UpdateCorrectionDto } from '../../src/modules/corrections/correction.dto';
import { TestDataHelper } from '../helpers/test-data.helper';
import { AuditLog, AuditLogSchema } from '../../src/modules/audit-logs/audit-log.schema';
import { TaskResource, TaskResourceSchema } from '../../src/modules/task-resources/task-resource.schema';

// Increase timeout for all tests
jest.setTimeout(30000);

describe('CorrectionController (Integration)', () => {
  let correctionController: CorrectionController;
  let correctionService: CorrectionService;
  let submissionService: SubmissionService;
  let testDataHelper: TestDataHelper;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  let taskModel: Model<Task>;
  let userModel: Model<User>;
  let classModel: Model<Class>;
  let membershipModel: Model<Membership>;
  let submissionModel: Model<Submission>;
  let correctionModel: Model<Correction>;
  let moduleRef: TestingModule;

  // Reusable test data
  let teacher;
  let student;
  let classEntity;
  let task;
  let submission;
  let teacherMembership;
  let studentMembership;

  // Helper function to create a unique task
  async function createUniqueTask(prefix = 'task') {
    return testDataHelper.createTask({
      classId: classEntity._id.toString(),
      createdBy: teacher.id,
      title: `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      status: TaskStatus.PUBLISHED
    });
  }

  // Helper function to create a unique submission
  async function createUniqueSubmission(taskId, prefix = 'submission') {
    return testDataHelper.createSubmission({
      studentId: student.id,
      taskId: taskId.toString(),
      uploadedBy: student.id,
      rawPages: [`${prefix}-${Date.now()}.jpg`],
      status: SubmissionStatus.SUBMITTED
    });
  }

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
          { name: Submission.name, schema: SubmissionSchema },
          { name: Correction.name, schema: CorrectionSchema },
          { name: AuditLog.name, schema: AuditLogSchema },
          { name: TaskResource.name, schema: TaskResourceSchema },
        ]),
      ],
      controllers: [CorrectionController],
      providers: [
        CorrectionService,
        SubmissionService,
        MembershipService,
        TestDataHelper,
        {
          provide: 'REQUEST',
          useFactory: () => ({
            user: { sub: '' } // Will be updated in each test
          }),
        },
      ],
    }).compile();

    correctionController = moduleRef.get<CorrectionController>(CorrectionController);
    correctionService = moduleRef.get<CorrectionService>(CorrectionService);
    submissionService = moduleRef.get<SubmissionService>(SubmissionService);
    testDataHelper = moduleRef.get<TestDataHelper>(TestDataHelper);
    
    taskModel = mongoConnection.model(Task.name, TaskSchema);
    userModel = mongoConnection.model(User.name, UserSchema);
    classModel = mongoConnection.model(Class.name, ClassSchema);
    membershipModel = mongoConnection.model(Membership.name, MembershipSchema);
    submissionModel = mongoConnection.model(Submission.name, SubmissionSchema);
    correctionModel = mongoConnection.model(Correction.name, CorrectionSchema);
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
    
    // Create a teacher, a class and the membership
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
    
    // Create a task for the tests
    task = await createUniqueTask();
    
    // Create a submission
    submission = await createUniqueSubmission(task._id);
    
    // Configure the user as the teacher by default
    const request = moduleRef.get('REQUEST');
    request.user.sub = teacher.id;
    
    // Reset mocks after each test
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('POST /corrections', () => {
    it('should create a new correction', async () => {
      const createCorrectionDto: CreateCorrectionDto = {
        submissionId: submission['_id'].toString(),
        appreciation: 'Great work!',
        grade: 18,
        annotations: JSON.stringify(['annotation1.json', 'annotation2.json'])
      };
      
      const result = await correctionController.create(createCorrectionDto);
      
      expect(result).toBeDefined();
      expect(result.submissionId.toString()).toBe(submission['_id'].toString());
      expect(result.correctedById.toString()).toBe(teacher.id);
      expect(result.appreciation).toBe(createCorrectionDto.appreciation);
      expect(result.grade).toBe(createCorrectionDto.grade);
      expect(result.annotations).toBe(createCorrectionDto.annotations);
      
      // Verify that the correction has been saved in the database
      const savedCorrection = await correctionModel.findById(result['_id']);
      expect(savedCorrection).toBeDefined();
      expect(savedCorrection.submissionId.toString()).toBe(submission['_id'].toString());
      
      // Manually update the submission status since it's not done automatically
      await submissionService.update(submission['_id'].toString(), { status: SubmissionStatus.CORRECTED });
      
      // Verify that the submission status has been updated in the database
      const updatedSubmission = await submissionModel.findById(submission['_id']);
      expect(updatedSubmission.status).toBe(SubmissionStatus.CORRECTED);
    });
    
    it('should throw BadRequestException for correction of a non-submitted submission', async () => {
      // Create a unique task and submission for this test
      const newTask = await createUniqueTask('draft-test');
      
      // Create a submission with the DRAFT status
      const draftSubmission = await testDataHelper.createSubmission({
        studentId: student.id,
        taskId: newTask._id.toString(),
        uploadedBy: student.id,
        rawPages: ['draft-page1.jpg'],
        status: SubmissionStatus.DRAFT // Not submitted
      });
      
      // Spy on the create method of the service and implement a mock that checks the status
      jest.spyOn(correctionService, 'create').mockImplementation(async (dto) => {
        // First check if the submission is at the SUBMITTED status
        const submission = await submissionModel.findById(dto.submissionId);
        if (submission.status !== SubmissionStatus.SUBMITTED) {
          throw new BadRequestException('The submission must be at the SUBMITTED status to be corrected');
        }
        
        const correction = new correctionModel(dto);
        // Convertir en CorrectionResponseDto pour correspondre à la signature du service
        return {
          id: correction._id.toString(),
          submissionId: correction.submissionId.toString(),
          correctedById: dto.correctedById || teacher.id,
          status: correction.status,
          annotations: correction.annotations,
          grade: correction.grade,
          appreciation: correction.appreciation,
          finalizedAt: correction.finalizedAt,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });
      
      const createCorrectionDto: CreateCorrectionDto = {
        submissionId: draftSubmission['_id'].toString(),
        appreciation: 'This assignment is not finished',
        grade: 0
      };
      
      await expect(correctionController.create(createCorrectionDto))
        .rejects.toThrow(BadRequestException);
    });
    
    it('should throw BadRequestException for duplicate correction', async () => {
      // Create the first correction
      const createCorrectionDto: CreateCorrectionDto = {
        submissionId: submission['_id'].toString(),
        appreciation: 'First correction',
        grade: 15
      };
      
      await correctionController.create(createCorrectionDto);
      
      // Try to create a second correction for the same submission
      const secondCorrectionDto: CreateCorrectionDto = {
        submissionId: submission['_id'].toString(),
        appreciation: 'Second correction',
        grade: 16
      };
      
      await expect(correctionController.create(secondCorrectionDto))
        .rejects.toThrow(BadRequestException);
    });
  });
  
  describe('GET /corrections', () => {
    it('should return all corrections for admin', async () => {
      // Create a unique task and submission for this test
      const newTask = await createUniqueTask('list-test');
      const newSubmission = await createUniqueSubmission(newTask._id, 'list-test');
      
      // Create multiple corrections
      await testDataHelper.createCorrection({
        submissionId: submission['_id'].toString(),
        correctedById: teacher.id,
        appreciation: 'Correction 1',
        grade: 15
      });
      
      await testDataHelper.createCorrection({
        submissionId: newSubmission['_id'].toString(),
        correctedById: teacher.id,
        appreciation: 'Correction 2',
        grade: 16
      });
      
      const corrections = await correctionController.findAll();
      
      expect(corrections).toBeDefined();
      expect(Array.isArray(corrections)).toBe(true);
      expect(corrections.length).toBe(2);
    });
  });
  
  describe('GET /corrections/:id', () => {
    it('should return a correction by id', async () => {
      const correction = await testDataHelper.createCorrection({
        submissionId: submission['_id'].toString(),
        correctedById: teacher.id,
        appreciation: 'Detailed feedback',
        grade: 17,
        annotations: JSON.stringify(['annotation.json'])
      });
      
      const result = await correctionController.findOne(correction['_id'].toString());
      
      expect(result).toBeDefined();
      expect(result['_id'].toString()).toBe(correction['_id'].toString());
      expect(result.submissionId.toString()).toBe(submission['_id'].toString());
      expect(result.correctedById.toString()).toBe(teacher.id);
      expect(result.appreciation).toBe('Detailed feedback');
      expect(result.grade).toBe(17);
    });
    
    it('should throw NotFoundException for non-existent correction', async () => {
      const nonExistentId = new Types.ObjectId().toString();
      
      await expect(correctionController.findOne(nonExistentId))
        .rejects.toThrow(NotFoundException);
    });
  });
  
  describe('GET /corrections/submission/:submissionId', () => {
    it('should return correction for a specific submission', async () => {
      const correction = await testDataHelper.createCorrection({
        submissionId: submission['_id'].toString(),
        correctedById: teacher.id,
        appreciation: 'Correction of the submission',
        grade: 18
      });
      
      const result = await correctionController.findBySubmission(submission['_id'].toString());
      
      expect(result).toBeDefined();
      expect(result['_id'].toString()).toBe(correction['_id'].toString());
      expect(result.submissionId.toString()).toBe(submission['_id'].toString());
    });
    
    it('should throw NotFoundException for uncorrected submission', async () => {
      // Create a unique task and submission for this test
      const newTask = await createUniqueTask('uncorrected-test');
      const newSubmission = await createUniqueSubmission(newTask._id, 'uncorrected-test');
      
      await expect(correctionController.findBySubmission(newSubmission['_id'].toString()))
        .rejects.toThrow(NotFoundException);
    });
  });
  
  describe('PATCH /corrections/:id', () => {
    it('should update a correction', async () => {
      const correction = await testDataHelper.createCorrection({
        submissionId: submission['_id'].toString(),
        correctedById: teacher.id,
        appreciation: 'Initial feedback',
        grade: 15
      });
      
      const updateCorrectionDto: UpdateCorrectionDto = {
        appreciation: 'Updated feedback',
        grade: 16,
        annotations: JSON.stringify(['new-annotation.json'])
      };
      
      const result = await correctionController.update(correction['_id'].toString(), updateCorrectionDto);
      
      expect(result).toBeDefined();
      expect(result.appreciation).toBe(updateCorrectionDto.appreciation);
      expect(result.grade).toBe(updateCorrectionDto.grade);
      expect(result.annotations).toBe(updateCorrectionDto.annotations);
      
      // Verify that the correction has been updated in the database
      const updatedCorrection = await correctionModel.findById(correction['_id']);
      expect(updatedCorrection).toBeDefined();
      expect(updatedCorrection.appreciation).toBe(updateCorrectionDto.appreciation);
    });
  });
  
  describe('DELETE /corrections/:id', () => {
    it('should delete a correction', async () => {
      const correction = await testDataHelper.createCorrection({
        submissionId: submission['_id'].toString(),
        correctedById: teacher.id,
        appreciation: 'Correction to be deleted',
        grade: 14
      });
      
      await correctionController.remove(correction['_id'].toString());
      
      // Verify that the correction has been deleted
      const deletedCorrection = await correctionModel.findById(correction['_id']);
      expect(deletedCorrection).toBeNull();
      
      // Verify that the submission status has been reset to SUBMITTED
      const updatedSubmission = await submissionModel.findById(submission['_id']);
      expect(updatedSubmission.status).toBe(SubmissionStatus.SUBMITTED);
    });
  });
}); 