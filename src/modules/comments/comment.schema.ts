import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Schema({
  timestamps: true,
})
export class Comment {
  @ApiProperty({
    description: 'ID of the correction this comment belongs to',
    example: '605a1cb9d4d5d73598045618',
    required: true
  })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Correction', required: true })
  correctionId: string;

  @ApiProperty({
    description: 'Page number in the document where the comment is placed',
    example: 2,
    required: true
  })
  @Prop({ required: true })
  pageNumber: number;

  @ApiPropertyOptional({
    description: 'Type of comment (e.g., highlight, note, annotation)',
    example: 'highlight',
    default: 'note'
  })
  @Prop({ type: String, default: 'note' })
  type: string;

  @ApiPropertyOptional({
    description: 'Color of the comment (hex code or named color)',
    example: '#FF5733',
    default: '#FFD700'
  })
  @Prop({ type: String, default: '#FFD700' })
  color: string;

  @ApiPropertyOptional({
    description: 'Whether the comment text contains markdown formatting',
    example: false,
    default: false
  })
  @Prop({ type: Boolean, default: false })
  markdown: boolean;

  @ApiProperty({
    description: 'Text content of the comment',
    example: 'This section needs more detailed explanation.'
  })
  @Prop({ type: String, required: true })
  text: string;

  @ApiPropertyOptional({
    description: 'Array of annotation references or IDs related to this comment',
    example: ['60d21b4667d0d8992e610c85', '60d21b4667d0d8992e610c86'],
    type: [String]
  })
  @Prop({ type: [String], default: [] })
  annotations: string[];

  @ApiProperty({
    description: 'ID of the user who created the comment',
    example: '605a1cb9d4d5d73598045618'
  })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: string;

  // Timestamps are added automatically by { timestamps: true }
  @ApiProperty({
    description: 'Comment creation date',
    example: '2023-01-01T12:00:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Comment last update date',
    example: '2023-01-01T12:00:00Z'
  })
  updatedAt: Date;
}

export type CommentDocument = Comment & Document;
export const CommentSchema = SchemaFactory.createForClass(Comment); 