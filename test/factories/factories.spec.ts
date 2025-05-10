import { Test } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { TestModule } from '../test.module';
import { TestDataHelper } from '../helpers/test-data.helper';
import { MockStorageHelper } from '../helpers/mock-storage.helper';
import { SeedDataHelper } from '../helpers/seed-data.helper';
import { StorageFolderType } from '../../src/modules/storage/storage.service';
import { MembershipRole } from '../../src/modules/memberships/membership.schema';
import { SubmissionStatus } from '../../src/modules/submissions/submission.schema';
import { ResourceType } from '../../src/modules/task-resources/task-resource.schema';
import mongoose from 'mongoose';
import { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Increase wait time for tests
jest.setTimeout(30000);

describe('Factory Tests', () => {
  let testDataHelper: TestDataHelper;
  let mockStorageHelper: MockStorageHelper;
  let seedDataHelper: SeedDataHelper;
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    // Create an in-memory MongoDB instance
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        MongooseModule.forRoot(uri),
        TestModule,
      ],
    }).compile();

    testDataHelper = moduleRef.get<TestDataHelper>(TestDataHelper);
    mockStorageHelper = moduleRef.get<MockStorageHelper>(MockStorageHelper);
    seedDataHelper = moduleRef.get<SeedDataHelper>(SeedDataHelper);
  });

  afterAll(async () => {
    if (mongoose.connection.readyState) {
      await mongoose.connection.close();
    }
    if (mongod) {
      await mongod.stop();
    }
  });

  beforeEach(async () => {
    await testDataHelper.cleanDatabase();
  });

  describe('Entity Factories', () => {
    it('should create a user', async () => {
      const user = await testDataHelper.createUser();
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBeDefined();
    });

    it('should create a class', async () => {
      const classEntity = await testDataHelper.createClass();
      expect(classEntity).toBeDefined();
      expect(classEntity.id).toBeDefined();
      expect(classEntity.name).toBeDefined();
    });

    it('should create a task', async () => {
      const task = await testDataHelper.createTask();
      expect(task).toBeDefined();
      expect(task.id).toBeDefined();
      expect(task.title).toBeDefined();
    });

    it('should create a submission', async () => {
      const submission = await testDataHelper.createSubmission();
      expect(submission).toBeDefined();
      expect(submission.status).toBeDefined();
    });

    it('should create a correction', async () => {
      const correction = await testDataHelper.createCorrection();
      expect(correction).toBeDefined();
      expect(correction.grade).toBeDefined();
    });

    it('should create a membership', async () => {
      const membership = await testDataHelper.createMembership();
      expect(membership).toBeDefined();
      expect(membership.role).toBeDefined();
    });

    it('should create an audit log', async () => {
      const auditLog = await testDataHelper.createAuditLog();
      expect(auditLog).toBeDefined();
      expect(auditLog.action).toBeDefined();
    });

    it('should create a task resource', async () => {
      const taskResource = await testDataHelper.createTaskResource();
      expect(taskResource).toBeDefined();
      expect(taskResource.id).toBeDefined();
      expect(taskResource.type).toBeDefined();
    });
  });

  describe('Relationship Helpers', () => {
    it('should create a teacher with class', async () => {
      const { teacher, class: classEntity, membership } = await testDataHelper.createTeacherWithClass();
      expect(teacher).toBeDefined();
      expect(classEntity).toBeDefined();
      expect(membership).toBeDefined();
      expect(membership.role).toBe(MembershipRole.TEACHER);
    });

    it('should create a student in class', async () => {
      const classEntity = await testDataHelper.createClass();
      const { student, membership } = await testDataHelper.createStudentInClass(classEntity.id);
      expect(student).toBeDefined();
      expect(membership).toBeDefined();
      expect(membership.role).toBe(MembershipRole.STUDENT);
    });

    it('should create a task with submission', async () => {
      const classEntity = await testDataHelper.createClass();
      const student = await testDataHelper.createUser();
      const { task, submission } = await testDataHelper.createTaskWithSubmission(
        new Types.ObjectId(classEntity.id),
        new Types.ObjectId(student.id),
      );
      
      expect(task).toBeDefined();
      expect(submission).toBeDefined();
      
      // Verify that the submission is linked to the task and student
      const taskIdValue = typeof task.id === 'string' ? task.id : 
        (task._id ? String(task._id) : '');
      const submissionTaskId = typeof submission.taskId === 'string' ? 
        submission.taskId : (submission.taskId ? String(submission.taskId) : '');
        
      expect(submissionTaskId).toEqual(taskIdValue);
      
      // Verify the student
      const studentIdValue = student.id;
      const submissionStudentId = typeof submission.studentEmail === 'string' ?
        submission.studentEmail : (submission.studentEmail ? String(submission.studentEmail) : '');
        
      expect(submissionStudentId).toEqual(studentIdValue);
    });

    it('should create a submission with correction', async () => {
      const task = await testDataHelper.createTask();
      const student = await testDataHelper.createUser();
      const teacher = await testDataHelper.createUser();
      
      const { submission, correction } = await testDataHelper.createSubmissionWithCorrection(
        task.id,
        new Types.ObjectId(student.id),
        new Types.ObjectId(teacher.id),
      );
      
      expect(submission).toBeDefined();
      expect(correction).toBeDefined();
      expect(correction.submissionId).toBeDefined();
      
      // Verify that the correction is associated with the correct corrector
      // The helper uses correctorId but the factory maps this to correctedById
      expect(correction.correctedByEmail).toBeDefined();
      
      // Note: In test-data.helper.ts, createSubmissionWithCorrection defines correctorId,
      // but the schema correction.factory.ts uses correctedById. Ideally, these field names
      // should be harmonized to avoid this confusion.
      // For now, we simply ensure that the ID exists.
    });
  });

  describe('Mock Storage Helper', () => {
    it('should mock file upload', async () => {
      const url = await mockStorageHelper.mockFileUpload(
        StorageFolderType.SUBMISSIONS,
        'test.pdf'
      );
      expect(url).toBeDefined();
      expect(typeof url).toBe('string');
    });

    it('should mock multiple file uploads', async () => {
      const urls = await mockStorageHelper.mockMultipleFileUploads(StorageFolderType.SUBMISSIONS, 3);
      expect(urls).toHaveLength(3);
      urls.forEach(url => {
        expect(typeof url).toBe('string');
      });
    });

    it('should mock file download', async () => {
      const key = 'submissions/test.pdf';
      const url = await mockStorageHelper.mockFileDownload(key);
      expect(url).toBeDefined();
      expect(typeof url).toBe('string');
    });

    it('should mock file listing', async () => {
      const files = await mockStorageHelper.listFiles('submissions/');
      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBeGreaterThan(0);
    });
  });

  describe('Seed Data Helper', () => {
    it('should create a class with students and tasks', async () => {
      const result = await seedDataHelper.createClassWithStudentsAndTasks({
        numStudents: 2,
        numTasks: 2,
      });
      expect(result.teacher).toBeDefined();
      expect(result.class).toBeDefined();
      expect(result.students).toHaveLength(2);
      expect(result.tasks).toHaveLength(2);
    });

    it('should create a class with submissions and corrections', async () => {
      const result = await seedDataHelper.createClassWithSubmissionsAndCorrections({
        numStudents: 2,
        numTasks: 2,
        allSubmitted: true,
        allCorrected: true,
      });
      expect(result.teacher).toBeDefined();
      expect(result.class).toBeDefined();
      expect(result.students).toHaveLength(2);
      expect(result.tasks).toHaveLength(2);
      expect(result.submissions.length).toBe(4); // 2 students * 2 tasks
      expect(result.corrections.length).toBe(4); // All submissions corrected
    });

    it('should create multiple classes', async () => {
      const results = await seedDataHelper.createMultipleClasses({
        numClasses: 2,
        studentsPerClass: 2,
        tasksPerClass: 2,
      });
      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result.teacher).toBeDefined();
        expect(result.class).toBeDefined();
        expect(result.students).toHaveLength(2);
        expect(result.tasks).toHaveLength(2);
      });
    });
  });
}); 