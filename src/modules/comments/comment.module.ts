import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { Comment, CommentSchema } from './comment.schema';
import { CorrectionModule } from '../corrections/correction.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Comment.name, schema: CommentSchema },
    ]),
    CorrectionModule, // Import pour accéder au CorrectionService
  ],
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService], // Export du service pour utilisation par d'autres modules
})
export class CommentModule {} 