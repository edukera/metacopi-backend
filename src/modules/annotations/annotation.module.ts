import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnnotationController } from './annotation.controller';
import { AnnotationService } from './annotation.service';
import { Annotation, AnnotationSchema } from './annotation.schema';
import { CorrectionModule } from '../corrections/correction.module';
import { IsValidJson } from './validators/is-valid-json.validator';
import { AnnotationAccessGuard } from '../../common/guards/annotation-access.guard';
import { MembershipModule } from '../memberships/membership.module';
import { TaskModule } from '../tasks/task.module';
import { SubmissionModule } from '../submissions/submission.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Annotation.name, schema: AnnotationSchema },
    ]),
    forwardRef(() => CorrectionModule),
    forwardRef(() => MembershipModule),
    forwardRef(() => TaskModule),
    forwardRef(() => SubmissionModule),
  ],
  controllers: [AnnotationController],
  providers: [AnnotationService, IsValidJson, AnnotationAccessGuard],
  exports: [AnnotationService],
})
export class AnnotationModule {} 