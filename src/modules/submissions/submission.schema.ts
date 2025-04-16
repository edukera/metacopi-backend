import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SubmissionStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  CORRECTED = 'corrected',
  ARCHIVED = 'archived',
}

@Schema({
  timestamps: true,
})
export class Submission {
  @ApiProperty({
    description: 'ID of the student who submitted the work',
    example: '605a1cb9d4d5d73598045618',
    required: true
  })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  studentId: string;

  @ApiProperty({
    description: 'ID of the task associated with the submission',
    example: '605a1cb9d4d5d73598045619',
    required: true
  })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Task', required: true })
  taskId: string;

  @ApiProperty({
    description: 'ID of the user who uploaded the submission (can be different from the student)',
    example: '605a1cb9d4d5d73598045618',
    required: true
  })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  uploadedBy: string;

  @ApiProperty({
    description: 'Current status of the submission',
    example: SubmissionStatus.SUBMITTED,
    enum: SubmissionStatus,
    default: SubmissionStatus.DRAFT
  })
  @Prop({
    type: String,
    enum: Object.values(SubmissionStatus),
    default: SubmissionStatus.DRAFT,
  })
  status: SubmissionStatus;

  @ApiProperty({
    description: 'List of URLs of raw (unprocessed) pages of the submission',
    example: ['https://example.com/storage/page1.jpg', 'https://example.com/storage/page2.jpg'],
    type: [String],
    default: []
  })
  @Prop({ type: [String], default: [] })
  rawPages: string[];

  @ApiProperty({
    description: 'List of URLs of processed pages of the submission',
    example: ['https://example.com/storage/processed_page1.jpg', 'https://example.com/storage/processed_page2.jpg'],
    type: [String],
    default: []
  })
  @Prop({ type: [String], default: [] })
  processedPages: string[];

  @ApiPropertyOptional({
    description: 'Date when the submission was submitted for correction',
    example: '2023-01-15T10:30:00Z'
  })
  @Prop({ type: Date })
  submittedAt: Date;

  @ApiPropertyOptional({
    description: 'Date when the submission was reviewed/corrected',
    example: '2023-01-20T14:45:00Z'
  })
  @Prop({ type: Date })
  reviewedAt: Date;

  @ApiProperty({
    description: 'Creation date of the submission',
    example: '2023-01-01T12:00:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date of the submission',
    example: '2023-01-01T12:00:00Z'
  })
  updatedAt: Date;
}

export type SubmissionDocument = Submission & Document;
export const SubmissionSchema = SchemaFactory.createForClass(Submission);

// Ensure uniqueness of submission per student and task
SubmissionSchema.index({ studentId: 1, taskId: 1 }, { unique: true }); 