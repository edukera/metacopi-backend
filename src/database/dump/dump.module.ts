import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DumpService } from './dump.service';
import { User, UserSchema } from '../../modules/users/user.schema';
import { Class, ClassSchema } from '../../modules/classes/class.schema';
import { Task, TaskSchema } from '../../modules/tasks/task.schema';
import { Membership, MembershipSchema } from '../../modules/memberships/membership.schema';
import { DatabaseModule } from '../database.module';
import { ConfigModule } from '../../config/config.module';
import { Submission, SubmissionSchema } from '../../modules/submissions/submission.schema';
import { Correction, CorrectionSchema } from '../../modules/corrections/correction.schema';
import { Annotation, AnnotationSchema } from '../../modules/annotations/annotation.schema';
import { Comment, CommentSchema } from '../../modules/comments/comment.schema';
import { AIComment, AICommentSchema } from '../../modules/ai-comments/ai-comment.schema';
import { AIAnnotation, AIAnnotationSchema } from '../../modules/ai-annotations/ai-annotation.schema';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Class.name, schema: ClassSchema },
      { name: Task.name, schema: TaskSchema },
      { name: Membership.name, schema: MembershipSchema },
      { name: Submission.name, schema: SubmissionSchema },
      { name: Correction.name, schema: CorrectionSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Annotation.name, schema: AnnotationSchema },
      { name: AIComment.name, schema: AICommentSchema },
      { name: AIAnnotation.name, schema: AIAnnotationSchema }
    ]),
  ],
  providers: [DumpService],
  exports: [DumpService],
})
export class DumpModule {} 