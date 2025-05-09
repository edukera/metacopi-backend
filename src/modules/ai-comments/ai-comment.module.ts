import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AICommentController } from './ai-comment.controller';
import { AICommentService } from './ai-comment.service';
import { AIComment, AICommentSchema } from './ai-comment.schema';
import { CorrectionModule } from '../corrections/correction.module';
import { AICommentAccessGuard } from '../../common/guards/ai-comment-access.guard';
import { MembershipModule } from '../memberships/membership.module';
import { TaskModule } from '../tasks/task.module';
import { SubmissionModule } from '../submissions/submission.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AIComment.name, schema: AICommentSchema },
    ]),
    forwardRef(() => CorrectionModule), // Import pour accéder au CorrectionService
    forwardRef(() => MembershipModule), // Pour MembershipService
    forwardRef(() => TaskModule), // Pour TaskService
    forwardRef(() => SubmissionModule), // Pour SubmissionService
  ],
  controllers: [AICommentController],
  providers: [
    AICommentService,
    AICommentAccessGuard,
  ],
  exports: [AICommentService], // Export du service pour utilisation par d'autres modules
})
export class AICommentModule {} 