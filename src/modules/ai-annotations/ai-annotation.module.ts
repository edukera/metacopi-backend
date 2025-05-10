import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AIAnnotationController } from './ai-annotation.controller';
import { AIAnnotationService as AIAnnotationService } from './ai-annotation.service';
import { AIAnnotation as AIAnnotation, AIAnnotationSchema as AIAnnotationSchema } from './ai-annotation.schema';
import { CorrectionModule } from '../corrections/correction.module';
import { MembershipModule } from '../memberships/membership.module';
import { TaskModule } from '../tasks/task.module';
import { SubmissionModule } from '../submissions/submission.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AIAnnotation.name, schema: AIAnnotationSchema },
    ]),
    forwardRef(() => CorrectionModule),
    forwardRef(() => MembershipModule),
    forwardRef(() => TaskModule),
    forwardRef(() => SubmissionModule),
  ],
  controllers: [AIAnnotationController],
  providers: [AIAnnotationService],
  exports: [AIAnnotationService],
})
export class AIAnnotationModule {} 