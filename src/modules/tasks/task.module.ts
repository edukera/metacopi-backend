import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Task, TaskSchema } from './task.schema';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { MembershipModule } from '../memberships/membership.module';
import { SubmissionModule } from '../submissions/submission.module';
import { TaskStatusTransitionValidator } from './validators/task-status-transition.validator';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
    ]),
    MembershipModule,
    forwardRef(() => SubmissionModule),
  ],
  controllers: [TaskController],
  providers: [TaskService, TaskStatusTransitionValidator],
  exports: [TaskService, TaskStatusTransitionValidator],
})
export class TaskModule {} 