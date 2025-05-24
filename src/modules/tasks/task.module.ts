import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Task, TaskSchema } from './task.schema';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { MembershipModule } from '../memberships/membership.module';
import { SubmissionModule } from '../submissions/submission.module';
import { TaskStatusTransitionValidator } from './validators/task-status-transition.validator';
import { Submission, SubmissionSchema } from '../submissions/submission.schema';
import { Correction, CorrectionSchema } from '../corrections/correction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: Submission.name, schema: SubmissionSchema },
      { name: Correction.name, schema: CorrectionSchema },
    ]),
    MembershipModule,
    forwardRef(() => SubmissionModule),
  ],
  controllers: [TaskController],
  providers: [TaskService, TaskStatusTransitionValidator],
  exports: [TaskService, TaskStatusTransitionValidator],
})
export class TaskModule {} 