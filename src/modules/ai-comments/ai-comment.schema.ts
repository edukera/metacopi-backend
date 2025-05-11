import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AICommentStatus } from './ai-comment.dto';

@Schema({
  timestamps: true,
  versionKey: false,
})
export class AIComment {
  @ApiProperty({
    description: 'Logical business identifier for the AI comment (unique)',
    example: 'AIC-2024-001',
    required: true
  })
  @Prop({ type: String, required: true, unique: true, trim: true })
  id: string;

  @ApiProperty({
    description: 'Logical business ID of the correction this AI comment belongs to',
    example: 'CORR-2024-001',
    required: true
  })
  @Prop({ type: String, required: true })
  correctionId: string;

  @ApiProperty({
    description: 'ID of the page in the submission where the AI comment is placed',
    example: 'p1',
    required: true
  })
  @Prop({ type: String, required: true })
  pageId: string;

  @ApiPropertyOptional({
    description: 'Type of AI comment (e.g., highlight, note, annotation)',
    example: 'highlight',
    default: 'note'
  })
  @Prop({ type: String, default: 'note' })
  type: string;

  @ApiPropertyOptional({
    description: 'Color of the AI comment (hex code or named color)',
    example: '#FF5733',
    default: '#FFD700'
  })
  @Prop({ type: String, default: '#FFD700' })
  color: string;

  @ApiPropertyOptional({
    description: 'Whether the main text content should be rendered as markdown',
    example: true,
    default: false
  })
  @Prop({ type: Boolean, default: false })
  isMarkdown: boolean;

  @ApiPropertyOptional({
    description: 'Raw Markdown content, if different from plain text or if specific Markdown features are used',
    example: 'This section needs **more detailed** explanation. See [doc](...)'
  })
  @Prop({ type: String, required: false })
  markdownSource?: string;

  @ApiProperty({
    description: 'Text content of the AI comment',
    example: 'This section needs more detailed explanation.'
  })
  @Prop({ type: String, required: true })
  text: string;

  @ApiPropertyOptional({
    description: 'Array of logical AI annotation IDs (not Mongo IDs) related to this AI comment',
    example: ['AIANN-2024-001', 'AIANN-2024-002'],
    type: [String]
  })
  @Prop({ type: [String], default: [] })
  annotations: string[];

  @ApiProperty({
    description: 'Status of the AI comment (validated, rejected, pending)',
    example: 'pending',
    default: 'pending',
    enum: AICommentStatus
  })
  @Prop({ type: String, enum: Object.values(AICommentStatus), default: AICommentStatus.PENDING })
  status: AICommentStatus;

  @ApiPropertyOptional({
    description: 'Vertical position of the AI comment on the page, if applicable',
    example: 120.5
  })
  @Prop({ type: Number, required: false })
  pageY?: number;

  @ApiProperty({
    description: 'Email of the user who created the AI comment',
    example: 'user@example.com',
    required: true
  })
  @Prop({ type: String, required: true })
  createdByEmail: string;

  // Timestamps are added automatically by { timestamps: true }
  @ApiProperty({
    description: 'AI comment creation date',
    example: '2023-01-01T12:00:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'AI comment last update date',
    example: '2023-01-01T12:00:00Z'
  })
  updatedAt: Date;
}

export type AICommentDocument = AIComment & Document;
export const AICommentSchema = SchemaFactory.createForClass(AIComment); 