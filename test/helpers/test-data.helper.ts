import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../../src/modules/users/user.schema';
import { Class } from '../../src/modules/classes/class.schema';
import { Task } from '../../src/modules/tasks/task.schema';
import { Submission } from '../../src/modules/submissions/submission.schema';
import { Correction } from '../../src/modules/corrections/correction.schema';
import { Membership, MembershipRole } from '../../src/modules/memberships/membership.schema';
import { AuditLog } from '../../src/modules/audit-logs/audit-log.schema';
import { TaskResource } from '../../src/modules/task-resources/task-resource.schema';
import { userStub, UserWithId } from '../factories/user.factory';
import { classStub, ClassStub } from '../factories/class.factory';
import { taskStub, TaskStub } from '../factories/task.factory';
import { submissionStub, SubmissionStub } from '../factories/submission.factory';
import { correctionStub, CorrectionStub } from '../factories/correction.factory';
import { membershipStub, MembershipStub } from '../factories/membership.factory';
import { auditLogStub, AuditLogStub } from '../factories/audit-log.factory';
import { taskResourceStub, TaskResourceStub } from '../factories/task-resource.factory';

@Injectable()
export class TestDataHelper {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Class.name) private classModel: Model<Class>,
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(Submission.name) private submissionModel: Model<Submission>,
    @InjectModel(Correction.name) private correctionModel: Model<Correction>,
    @InjectModel(Membership.name) private membershipModel: Model<Membership>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLog>,
    @InjectModel(TaskResource.name) private taskResourceModel: Model<TaskResource>,
  ) {}

  async cleanDatabase() {
    await Promise.all([
      this.userModel.deleteMany({}),
      this.classModel.deleteMany({}),
      this.taskModel.deleteMany({}),
      this.submissionModel.deleteMany({}),
      this.correctionModel.deleteMany({}),
      this.membershipModel.deleteMany({}),
      this.auditLogModel.deleteMany({}),
      this.taskResourceModel.deleteMany({}),
    ]);
  }

  async createUser(overrides?: Partial<UserWithId>): Promise<UserWithId> {
    const stub = userStub(overrides);
    const user = await this.userModel.create(stub);
    return {
      ...user.toObject(),
      id: user._id.toString(),
    };
  }

  async createClass(overrides?: Partial<ClassStub>): Promise<Class> {
    const stub = classStub(overrides);
    const classEntity = new this.classModel(stub);
    return classEntity.save();
  }

  async createTask(overrides?: Partial<TaskStub>): Promise<Task> {
    const stub = taskStub(overrides);
    const task = new this.taskModel(stub);
    return task.save();
  }

  async createSubmission(overrides?: Partial<SubmissionStub>): Promise<Submission> {
    const stub = submissionStub(overrides);
    const submission = new this.submissionModel(stub);
    return submission.save();
  }

  async createCorrection(overrides?: Partial<CorrectionStub>): Promise<Correction> {
    const stub = correctionStub(overrides);
    const correction = new this.correctionModel(stub);
    return correction.save();
  }

  async createMembership(overrides?: Partial<MembershipStub>): Promise<Membership> {
    const stub = membershipStub(overrides);
    const membership = new this.membershipModel(stub);
    return membership.save();
  }

  async createAuditLog(overrides?: Partial<AuditLogStub>): Promise<AuditLog> {
    const stub = auditLogStub(overrides);
    const auditLog = new this.auditLogModel(stub);
    return auditLog.save();
  }

  async createTaskResource(overrides?: Partial<TaskResourceStub>): Promise<TaskResource> {
    const stub = taskResourceStub(overrides);
    const taskResource = new this.taskResourceModel(stub);
    return taskResource.save();
  }

  async createTeacherWithClass(userOverrides?: Partial<UserWithId>, classOverrides?: Partial<ClassStub>): Promise<{
    teacher: UserWithId;
    class: Class;
    membership: Membership;
  }> {
    const teacher = await this.createUser(userOverrides);
    const classEntity = await this.createClass({ ...classOverrides, createdBy: new Types.ObjectId(teacher.id) });
    const membership = await this.createMembership({
      userId: teacher.id,
      classId: classEntity._id.toString(),
      role: MembershipRole.TEACHER,
    });

    return { teacher, class: classEntity, membership };
  }

  async createStudentInClass(classId: Types.ObjectId, userOverrides?: Partial<UserWithId>): Promise<{
    student: UserWithId;
    membership: Membership;
  }> {
    const student = await this.createUser(userOverrides);
    const membership = await this.createMembership({
      userId: student.id,
      classId: classId.toString(),
      role: MembershipRole.STUDENT,
    });

    return { student, membership };
  }

  async createTaskWithSubmission(classId: Types.ObjectId, studentId: Types.ObjectId, taskOverrides?: Partial<TaskStub>, submissionOverrides?: Partial<SubmissionStub>): Promise<{
    task: Task;
    submission: Submission;
  }> {
    const task = await this.createTask({ ...taskOverrides, classId: classId.toString() });
    const submission = await this.createSubmission({
      ...submissionOverrides,
      taskId: task._id.toString(),
      studentId: studentId.toString(),
    });

    return { task, submission };
  }

  async createSubmissionWithCorrection(taskId: Types.ObjectId, studentId: Types.ObjectId, teacherId: Types.ObjectId, submissionOverrides?: Partial<SubmissionStub>, correctionOverrides?: Partial<CorrectionStub>): Promise<{
    submission: Submission;
    correction: Correction;
  }> {
    const submission = await this.createSubmission({
      ...submissionOverrides,
      taskId: taskId.toString(),
      studentId: studentId.toString(),
    });

    const submissionId = submission['_id'] ? submission['_id'].toString() : submission['id']?.toString();

    const correction = await this.createCorrection({
      ...correctionOverrides,
      submissionId: submissionId,
      correctedById: teacherId.toString(),
      taskId: taskId.toString(),
    });

    return { submission, correction };
  }
} 