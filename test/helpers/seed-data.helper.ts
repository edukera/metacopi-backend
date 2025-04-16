import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { TestDataHelper } from './test-data.helper';
import { MembershipRole } from '../../src/modules/memberships/membership.schema';
import { SubmissionStatus } from '../../src/modules/submissions/submission.schema';
import { UserWithId } from '../factories/user.factory';
import { Class } from '../../src/modules/classes/class.schema';
import { Task } from '../../src/modules/tasks/task.schema';
import { Submission } from '../../src/modules/submissions/submission.schema';
import { Correction } from '../../src/modules/corrections/correction.schema';
import { Membership } from '../../src/modules/memberships/membership.schema';

@Injectable()
export class SeedDataHelper {
  constructor(private readonly testDataHelper: TestDataHelper) {}

  /**
   * Creates a class with a teacher, students and tasks
   */
  async createClassWithStudentsAndTasks(options: {
    numStudents?: number;
    numTasks?: number;
  } = {}): Promise<{
    teacher: UserWithId;
    class: Class;
    teacherMembership: Membership;
    students: Array<{ student: UserWithId; membership: Membership }>;
    tasks: Task[];
  }> {
    const numStudents = options.numStudents || 5;
    const numTasks = options.numTasks || 3;

    // Create a teacher
    const teacher = await this.testDataHelper.createUser();
    
    // Create a class
    const classEntity = await this.testDataHelper.createClass({
      createdBy: new Types.ObjectId(teacher.id),
    });

    // Create teacher membership
    const teacherMembership = await this.testDataHelper.createMembership({
      userId: teacher.id,
      classId: classEntity.id,
      role: MembershipRole.TEACHER,
    });

    // Create students and their memberships
    const students = await Promise.all(
      Array(numStudents)
        .fill(null)
        .map(() => this.testDataHelper.createStudentInClass(new Types.ObjectId(classEntity.id)))
    );

    // Create tasks
    const tasks = await Promise.all(
      Array(numTasks)
        .fill(null)
        .map(() => this.testDataHelper.createTask({
          classId: classEntity.id,
          createdBy: teacher.id,
        }))
    );

    return {
      teacher,
      class: classEntity,
      teacherMembership,
      students,
      tasks,
    };
  }

  /**
   * Creates a class with submissions and corrections
   */
  async createClassWithSubmissionsAndCorrections(options: {
    numStudents?: number;
    numTasks?: number;
    allSubmitted?: boolean;
    allCorrected?: boolean;
  } = {}): Promise<{
    teacher: UserWithId;
    class: Class;
    students: Array<{ student: UserWithId; membership: Membership }>;
    tasks: Task[];
    submissions: Submission[];
    corrections: Correction[];
  }> {
    const { teacher, class: classEntity, students, tasks } = 
      await this.createClassWithStudentsAndTasks({
        numStudents: options.numStudents,
        numTasks: options.numTasks,
      });

    const submissions: Submission[] = [];
    const corrections: Correction[] = [];

    // Create submissions for each student and task
    for (const { student } of students) {
      for (const task of tasks) {
        if (options.allSubmitted || Math.random() > 0.3) {
          const { submission } = await this.testDataHelper.createTaskWithSubmission(
            typeof classEntity.id === 'string' ? new Types.ObjectId(classEntity.id) : classEntity.id,
            new Types.ObjectId(student.id),
            undefined,
            { status: SubmissionStatus.SUBMITTED }
          );
          submissions.push(submission);

          // Create a correction if needed
          if (options.allCorrected || Math.random() > 0.5) {
            const taskId = typeof task.id === 'string' ? new Types.ObjectId(task.id) : task.id;
            const { correction } = await this.testDataHelper.createSubmissionWithCorrection(
              taskId,
              new Types.ObjectId(student.id),
              new Types.ObjectId(teacher.id)
            );
            corrections.push(correction);
          }
        }
      }
    }

    return {
      teacher,
      class: classEntity,
      students,
      tasks,
      submissions,
      corrections,
    };
  }

  /**
   * Creates multiple classes with their members
   */
  async createMultipleClasses(options: {
    numClasses?: number;
    studentsPerClass?: number;
    tasksPerClass?: number;
  } = {}): Promise<Array<{
    teacher: UserWithId;
    class: Class;
    students: Array<{ student: UserWithId; membership: Membership }>;
    tasks: Task[];
  }>> {
    const numClasses = options.numClasses || 3;
    
    return Promise.all(
      Array(numClasses)
        .fill(null)
        .map(() => this.createClassWithStudentsAndTasks({
          numStudents: options.studentsPerClass,
          numTasks: options.tasksPerClass,
        }))
    );
  }
} 