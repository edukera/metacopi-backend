import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CorrectionController } from './correction.controller';
import { CorrectionService } from './correction.service';
import { Correction, CorrectionSchema } from './correction.schema';
import { CorrectionStatusTransitionValidator } from './validators/correction-status-transition.validator';
import { MembershipModule } from '../memberships/membership.module';
import { TaskModule } from '../tasks/task.module';
import { SubmissionModule } from '../submissions/submission.module';
import { CorrectionAccessGuard } from '../../common/guards/correction-access.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Correction.name, schema: CorrectionSchema },
    ]),
    MembershipModule,
    forwardRef(() => TaskModule),
    forwardRef(() => SubmissionModule),
  ],
  controllers: [CorrectionController],
  providers: [CorrectionService, CorrectionStatusTransitionValidator, CorrectionAccessGuard],
  exports: [CorrectionService, CorrectionStatusTransitionValidator],
})
export class CorrectionModule {} 