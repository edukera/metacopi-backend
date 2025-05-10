import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, connect, Model, Types } from 'mongoose';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { BadRequestException, NotFoundException, HttpStatus } from '@nestjs/common';

import { SubmissionController } from '../../src/modules/submissions/submission.controller';
import { SubmissionService } from '../../src/modules/submissions/submission.service';
import { Submission, SubmissionSchema, SubmissionStatus } from '../../src/modules/submissions/submission.schema';
import { Task, TaskSchema, TaskStatus } from '../../src/modules/tasks/task.schema';
import { Class, ClassSchema } from '../../src/modules/classes/class.schema';
import { User, UserSchema, UserRole } from '../../src/modules/users/user.schema';
import { Membership, MembershipRole, MembershipSchema } from '../../src/modules/memberships/membership.schema';
import { Correction, CorrectionSchema } from '../../src/modules/corrections/correction.schema';
import { AuditLog, AuditLogSchema } from '../../src/modules/audit-logs/audit-log.schema';
import { TaskResource, TaskResourceSchema } from '../../src/modules/task-resources/task-resource.schema';
import { MembershipService } from '../../src/modules/memberships/membership.service';
import { CorrectionService } from '../../src/modules/corrections/correction.service';
import { CreateSubmissionDto, UpdateSubmissionDto } from '../../src/modules/submissions/submission.dto';
import { TestDataHelper } from '../helpers/test-data.helper';

// Increase timeout for all tests
jest.setTimeout(30000);

describe('SubmissionController (Integration)', () => {
  let submissionController: SubmissionController;
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
  let auditLogModel: Model<AuditLog>;
  let taskResourceModel: Model<TaskResource>;
  let moduleRef: TestingModule;

  // Reusable test data
  let teacher;
  let student;
  let classEntity;
  let task;
  let teacherMembership;
  let studentMembership;

  // Custom type to resolve the '_id' issue
  interface SubmissionWithId extends Submission {
    _id: Types.ObjectId;
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
      controllers: [SubmissionController],
      providers: [
        SubmissionService,
        MembershipService,
        CorrectionService,
        TestDataHelper,
        {
          provide: 'REQUEST',
          useFactory: () => ({
            user: { sub: '' } // Will be updated in each test
          }),
        },
      ],
    }).compile();

    submissionController = moduleRef.get<SubmissionController>(SubmissionController);
    submissionService = moduleRef.get<SubmissionService>(SubmissionService);
    testDataHelper = moduleRef.get<TestDataHelper>(TestDataHelper);
    
    taskModel = mongoConnection.model(Task.name, TaskSchema);
    userModel = mongoConnection.model(User.name, UserSchema);
    classModel = mongoConnection.model(Class.name, ClassSchema);
    membershipModel = mongoConnection.model(Membership.name, MembershipSchema);
    submissionModel = mongoConnection.model(Submission.name, SubmissionSchema);
    correctionModel = mongoConnection.model(Correction.name, CorrectionSchema);
    auditLogModel = mongoConnection.model(AuditLog.name, AuditLogSchema);
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
    
    // Create a task for submission tests
    task = await testDataHelper.createTask({
      classId: classEntity._id.toString(),
      createdBy: teacher.id,
      title: 'Task for submission',
      status: TaskStatus.PUBLISHED
    });
    
    // Configure the user as the student by default
    const request = moduleRef.get('REQUEST');
    request.user.sub = student.id;
    
    // Reset mocks after each test
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  // describe('POST /submissions', () => {
  //   it('should create a new submission', async () => {
  //     const createSubmissionDto: CreateSubmissionDto = {
  //       taskId: task._id.toString(),
  //       rawPages: ['page1.jpg', 'page2.jpg'],
  //     };
      
  //     const result = await submissionController.create(createSubmissionDto);
      
  //     expect(result).toBeDefined();
  //     expect(result.taskId.toString()).toBe(task._id.toString());
  //     expect(result.studentId.toString()).toBe(student.id);
  //     expect(result.uploadedBy.toString()).toBe(student.id);
  //     expect(result.rawPages).toEqual(expect.arrayContaining(createSubmissionDto.rawPages));
  //     expect(result.status).toBe(SubmissionStatus.DRAFT);
      
  //     // Verify that the submission was saved in the database
  //     const savedSubmission = await submissionModel.findById((result as any)._id);
  //     expect(savedSubmission).toBeDefined();
  //     expect(savedSubmission.taskId.toString()).toBe(task._id.toString());
  //   });
    
  //   it('should throw BadRequestException for duplicate submission', async () => {
  //     // Create a first submission
  //     const createSubmissionDto: CreateSubmissionDto = {
  //       taskId: task._id.toString(),
  //       rawPages: ['page1.jpg'],
  //     };
      
  //     await submissionController.create(createSubmissionDto);
      
  //     // Try to create a second submission for the same student and task
  //     await expect(submissionController.create(createSubmissionDto))
  //       .rejects.toThrow(BadRequestException);
  //   });
    
  //   it('should allow teacher to create submission for student', async () => {
  //     // Configure the user as the teacher
  //     const request = moduleRef.get('REQUEST');
  //     request.user.sub = teacher.id;
      
  //     const createSubmissionDto: CreateSubmissionDto = {
  //       taskId: task._id.toString(),
  //       studentId: student.id,
  //       rawPages: ['page1.jpg'],
  //     };
      
  //     const result = await submissionController.create(createSubmissionDto);
      
  //     expect(result).toBeDefined();
  //     expect(result.studentId.toString()).toBe(student.id);
  //     expect(result.uploadedBy.toString()).toBe(teacher.id);
  //   });
  // });

  // describe('GET /submissions', () => {
  //   it('should fetch submissions by task ID', async () => {
  //     // Create some submissions for the task
  //     await testDataHelper.createSubmission({
  //       taskId: task._id.toString(),
  //       studentId: student.id,
  //       status: SubmissionStatus.SUBMITTED
  //     });
      
  //     // Create another student with a submission
  //     const { student: student2 } = await testDataHelper.createStudentInClass(
  //       classEntity._id,
  //       { firstName: 'Student2', lastName: 'Test', email: 'student2@test.com' }
  //     );
      
  //     await testDataHelper.createSubmission({
  //       taskId: task._id.toString(),
  //       studentId: student2.id,
  //       status: SubmissionStatus.DRAFT
  //     });
      
  //     // Configure the user as the teacher
  //     const request = moduleRef.get('REQUEST');
  //     request.user.sub = teacher.id;
      
  //     const result = await submissionController.findByTask(task._id.toString());
      
  //     expect(result).toBeDefined();
  //     expect(Array.isArray(result)).toBe(true);
  //     expect(result.length).toBe(2);
  //     expect(result.some(sub => sub.studentId.toString() === student.id)).toBe(true);
  //     expect(result.some(sub => sub.studentId.toString() === student2.id)).toBe(true);
  //   });
    
  //   it('should fetch student submissions by student ID', async () => {
  //     // Create a submission for the student
  //     const submission1 = await testDataHelper.createSubmission({
  //       taskId: task._id.toString(),
  //       studentId: student.id,
  //       status: SubmissionStatus.SUBMITTED
  //     });
      
  //     // Create another task
  //     const task2 = await testDataHelper.createTask({
  //       classId: classEntity._id.toString(),
  //       createdBy: teacher.id,
  //       title: 'Second task',
  //       status: TaskStatus.PUBLISHED
  //     });
      
  //     // Create a submission for the second task
  //     const submission2 = await testDataHelper.createSubmission({
  //       taskId: task2._id.toString(),
  //       studentId: student.id,
  //       status: SubmissionStatus.DRAFT
  //     });
      
  //     // Configure the user as the student
  //     const request = moduleRef.get('REQUEST');
  //     request.user.sub = student.id;
      
  //     const result = await submissionController.findByStudent(student.id);
      
  //     expect(result).toBeDefined();
  //     expect(Array.isArray(result)).toBe(true);
  //     expect(result.length).toBe(2);
  //     expect(result.some(sub => sub.taskId.toString() === task._id.toString())).toBe(true);
  //     expect(result.some(sub => sub.taskId.toString() === task2._id.toString())).toBe(true);
  //   });
  // });
  
  // describe('GET /submissions/:id', () => {
  //   it('should fetch a specific submission by ID', async () => {
  //     // Create a submission for the student
  //     const submission = await testDataHelper.createSubmission({
  //       taskId: task._id.toString(),
  //       studentId: student.id,
  //       status: SubmissionStatus.SUBMITTED,
  //       rawPages: ['page1.jpg']
  //     }) as SubmissionWithId;
      
  //     const result = await submissionController.findOne(submission._id.toString());
      
  //     expect(result).toBeDefined();
  //     expect((result as any)._id.toString()).toBe(submission._id.toString());
  //     expect(result.taskId.toString()).toBe(task._id.toString());
  //     expect(result.studentId.toString()).toBe(student.id);
  //   });
    
  //   it('should throw NotFoundException for non-existent submission', async () => {
  //     const nonExistentId = new Types.ObjectId().toString();
      
  //     await expect(submissionController.findOne(nonExistentId))
  //       .rejects.toThrow(NotFoundException);
  //   });
  // });
  
  // describe('GET /submissions/student/:studentId/task/:taskId', () => {
  //   it('should fetch a submission by student and task', async () => {
  //     // Create a submission for the student
  //     const submission = await testDataHelper.createSubmission({
  //       taskId: task._id.toString(),
  //       studentId: student.id,
  //       status: SubmissionStatus.SUBMITTED,
  //       rawPages: ['page1.jpg', 'page2.jpg']
  //     }) as SubmissionWithId;
      
  //     const result = await submissionController.findByStudentAndTask(student.id, task._id.toString());
      
  //     expect(result).toBeDefined();
  //     expect(result.taskId.toString()).toBe(task._id.toString());
  //     expect(result.studentId.toString()).toBe(student.id);
  //     expect(result.rawPages.length).toBe(2);
  //   });
    
  //   it('should throw NotFoundException if no submission exists', async () => {
  //     // No submission created in advance
      
  //     await expect(submissionController.findByStudentAndTask(student.id, task._id.toString()))
  //       .rejects.toThrow(NotFoundException);
  //   });
  // });
  
  // describe('PATCH /submissions/:id', () => {
  //   it('should update a submission', async () => {
  //     // Create a submission to update
  //     const submission = await testDataHelper.createSubmission({
  //       taskId: task._id.toString(),
  //       studentId: student.id,
  //       status: SubmissionStatus.DRAFT,
  //       rawPages: ['page1.jpg']
  //     }) as SubmissionWithId;
      
  //     const updateSubmissionDto: UpdateSubmissionDto = {
  //       status: SubmissionStatus.SUBMITTED,
  //       rawPages: ['page1.jpg', 'page2.jpg'],
  //       submittedAt: new Date()
  //     };
      
  //     const result = await submissionController.update(submission._id.toString(), updateSubmissionDto);
      
  //     expect(result).toBeDefined();
  //     expect(result.status).toBe(SubmissionStatus.SUBMITTED);
  //     expect(result.rawPages.length).toBe(2);
  //     expect(result.rawPages).toContain('page2.jpg');
  //     expect(result.submittedAt).toBeDefined();
      
  //     // Verify in the database
  //     const updatedSubmission = await submissionModel.findById(submission._id);
  //     expect(updatedSubmission.status).toBe(SubmissionStatus.SUBMITTED);
  //     expect(updatedSubmission.rawPages.length).toBe(2);
  //   });
    
  //   it('should throw NotFoundException for non-existent submission', async () => {
  //     const nonExistentId = new Types.ObjectId().toString();
      
  //     const updateSubmissionDto: UpdateSubmissionDto = {
  //       status: SubmissionStatus.SUBMITTED
  //     };
      
  //     await expect(submissionController.update(nonExistentId, updateSubmissionDto))
  //       .rejects.toThrow(NotFoundException);
  //   });
    
  //   it('should allow student to update another\'s submission (security issue to fix)', async () => {
  //     // Create another student
  //     const { student: student2 } = await testDataHelper.createStudentInClass(
  //       classEntity._id,
  //       { firstName: 'Other', lastName: 'Student', email: 'autre@test.com' }
  //     );
      
  //     // Create a submission for this student
  //     const submission = await testDataHelper.createSubmission({
  //       taskId: task._id.toString(),
  //       studentId: student2.id,
  //       status: SubmissionStatus.DRAFT
  //     }) as SubmissionWithId;
      
  //     // Configure the user as the first student
  //     const request = moduleRef.get('REQUEST');
  //     request.user.sub = student.id;
      
  //     const updateSubmissionDto: UpdateSubmissionDto = {
  //       status: SubmissionStatus.SUBMITTED
  //     };
      
  //     // NOTE: This behavior should be fixed to prevent a student
  //     // from modifying another student's submissions
  //     const result = await submissionController.update(submission._id.toString(), updateSubmissionDto);
  //     expect(result).toBeDefined();
  //     expect(result.status).toBe(SubmissionStatus.SUBMITTED);
  //   });
  // });
  
  // describe('DELETE /submissions/:id', () => {
  //   it('should remove a submission', async () => {
  //     // Create a submission to delete
  //     const submission = await testDataHelper.createSubmission({
  //       taskId: task._id.toString(),
  //       studentId: student.id,
  //       status: SubmissionStatus.DRAFT
  //     }) as SubmissionWithId;
      
  //     await submissionController.remove(submission._id.toString());
      
  //     // Verify that the submission was deleted
  //     const deletedSubmission = await submissionModel.findById(submission._id);
  //     expect(deletedSubmission).toBeNull();
  //   });
    
  //   it('should throw NotFoundException for non-existent submission', async () => {
  //     const nonExistentId = new Types.ObjectId().toString();
      
  //     await expect(submissionController.remove(nonExistentId))
  //       .rejects.toThrow(NotFoundException);
  //   });
    
  //   it('should allow student to delete teacher\'s submission (security issue to fix)', async () => {
  //     // Configure the user as the teacher
  //     const request = moduleRef.get('REQUEST');
  //     request.user.sub = teacher.id;
      
  //     // Create a submission by the teacher for the student
  //     const submission = await testDataHelper.createSubmission({
  //       taskId: task._id.toString(),
  //       studentId: student.id,
  //       uploadedBy: teacher.id,
  //       status: SubmissionStatus.DRAFT
  //     }) as SubmissionWithId;
      
  //     // Configure the user as the student
  //     request.user.sub = student.id;
      
  //     // NOTE: This behavior should be fixed to prevent a student
  //     // from deleting a submission created by a teacher
  //     await submissionController.remove(submission._id.toString());
      
  //     // Verify that the submission was deleted
  //     const deletedSubmission = await submissionModel.findById(submission._id);
  //     expect(deletedSubmission).toBeNull();
  //   });
  // });
}); 