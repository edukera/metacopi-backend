import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../src/modules/users/user.schema';
import { Class, ClassSchema } from '../src/modules/classes/class.schema';
import { Task, TaskSchema } from '../src/modules/tasks/task.schema';
import { Submission, SubmissionSchema } from '../src/modules/submissions/submission.schema';
import { Correction, CorrectionSchema } from '../src/modules/corrections/correction.schema';
import { Membership, MembershipSchema } from '../src/modules/memberships/membership.schema';
import { AuditLog, AuditLogSchema } from '../src/modules/audit-logs/audit-log.schema';
import { TaskResource, TaskResourceSchema } from '../src/modules/task-resources/task-resource.schema';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TestDataHelper } from './helpers/test-data.helper';
import { MockStorageHelper } from './helpers/mock-storage.helper';
import { SeedDataHelper } from './helpers/seed-data.helper';
import { MongoUserRepository } from '../src/modules/users/user.repository';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Class.name, schema: ClassSchema },
      { name: Task.name, schema: TaskSchema },
      { name: Submission.name, schema: SubmissionSchema },
      { name: Correction.name, schema: CorrectionSchema },
      { name: Membership.name, schema: MembershipSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: TaskResource.name, schema: TaskResourceSchema },
    ]),
  ],
  providers: [
    ConfigService,
    TestDataHelper,
    MockStorageHelper,
    SeedDataHelper,
    MongoUserRepository,
  ],
  exports: [
    TestDataHelper,
    MockStorageHelper,
    SeedDataHelper,
    MongoUserRepository,
  ],
})
export class TestModule {} 