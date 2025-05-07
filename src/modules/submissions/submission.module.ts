import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Submission, SubmissionSchema } from './submission.schema';
import { SubmissionService } from './submission.service';
import { SubmissionController } from './submission.controller';
import { CorrectionModule } from '../corrections/correction.module';
import { SubmissionStatusTransitionValidator } from './validators/submission-status-transition.validator';
import { TaskModule } from '../tasks/task.module';
import { MembershipModule } from '../memberships/membership.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Submission.name, schema: SubmissionSchema },
    ]),
    forwardRef(() => CorrectionModule),
    forwardRef(() => TaskModule),
    MembershipModule,
    StorageModule,
  ],
  controllers: [SubmissionController],
  providers: [SubmissionService, SubmissionStatusTransitionValidator],
  exports: [SubmissionService, SubmissionStatusTransitionValidator],
})
export class SubmissionModule {} 