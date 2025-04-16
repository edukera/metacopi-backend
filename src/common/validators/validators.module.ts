import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StatusTransitionService } from './status-transition.service';
import { TaskStatusTransitionValidator } from '../../modules/tasks/validators/task-status-transition.validator';
import { SubmissionStatusTransitionValidator } from '../../modules/submissions/validators/submission-status-transition.validator';
import { CorrectionStatusTransitionValidator } from '../../modules/corrections/validators/correction-status-transition.validator';
import { Task, TaskSchema } from '../../modules/tasks/task.schema';
import { Submission, SubmissionSchema } from '../../modules/submissions/submission.schema';
import { Correction, CorrectionSchema } from '../../modules/corrections/correction.schema';

/**
 * Module for centralized validators
 * The validators used by multiple modules are grouped here
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: Submission.name, schema: SubmissionSchema },
      { name: Correction.name, schema: CorrectionSchema },
    ]),
  ],
  providers: [
    StatusTransitionService,
    TaskStatusTransitionValidator,
    SubmissionStatusTransitionValidator,
    CorrectionStatusTransitionValidator,
  ],
  exports: [StatusTransitionService],
})
export class ValidatorsModule {} 