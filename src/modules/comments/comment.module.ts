import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { Comment, CommentSchema } from './comment.schema';
import { CorrectionModule } from '../corrections/correction.module';
import { CommentAccessGuard } from '../../common/guards/comment-access.guard';
import { MembershipModule } from '../memberships/membership.module';
import { TaskModule } from '../tasks/task.module';
import { SubmissionModule } from '../submissions/submission.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Comment.name, schema: CommentSchema },
    ]),
    forwardRef(() => CorrectionModule), // Import pour accéder au CorrectionService
    forwardRef(() => MembershipModule), // Pour MembershipService
    forwardRef(() => TaskModule), // Pour TaskService
    forwardRef(() => SubmissionModule), // Pour SubmissionService
  ],
  controllers: [CommentController],
  providers: [
    CommentService,
    CommentAccessGuard,
  ],
  exports: [CommentService], // Export du service pour utilisation par d'autres modules
})
export class CommentModule {} 