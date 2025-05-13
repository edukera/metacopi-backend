import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SubmissionStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  CORRECTED = 'corrected',
  ARCHIVED = 'archived',
}

export class SubmissionPage {
  @ApiProperty({ description: 'Page unique identifier', example: 'p1' })
  @Prop({ type: String, required: true })
  id: string;

  @ApiProperty({
    description: 'Raw image info',
    example: { image_path: 'submissions/demo-submission-2/raw-page-1.jpg', width: 3468, height: 4624 }
  })
  @Prop({
    type: {
      image_path: { type: String, required: true },
      width: { type: Number, required: true },
      height: { type: Number, required: true }
    },
    required: true
  })
  raw: { image_path: string; width: number; height: number };

  @ApiProperty({
    description: 'Processed image info',
    example: { image_path: 'submissions/demo-submission-2/processed-page-1.jpg', width: 867, height: 1156 }
  })
  @Prop({
    type: {
      image_path: { type: String, required: true },
      width: { type: Number, required: true },
      height: { type: Number, required: true }
    },
    required: true
  })
  processed: { image_path: string; width: number; height: number };
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Submission {
  @ApiProperty({
    description: 'Logical business identifier for the submission (unique)',
    example: 'SUB-2024-001',
    required: true
  })
  @Prop({ type: String, required: true, unique: true, trim: true })
  id: string;

  @ApiProperty({
    description: 'ID of the student who submitted the work',
    example: '605a1cb9d4d5d73598045618',
    required: true
  })
  @Prop({ type: String, required: true })
  studentEmail: string;

  @ApiProperty({
    description: 'Logical business ID of the task associated with the submission',
    example: 'TASK-2024-001',
    required: true
  })
  @Prop({ type: String, required: true })
  taskId: string;

  @ApiProperty({
    description: 'Email of the user who uploaded the submission (can be different from the student)',
    example: 'teacher@example.com',
    required: true
  })
  @Prop({ type: String, required: true })
  uploadedByEmail: string;

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
    description: 'List of pages (raw and processed info)',
    example: [
      {
        id: 'p1',
        raw: { image_path: 'submissions/demo-submission-2/raw-page-1.jpg', width: 3468, height: 4624 },
        processed: { image_path: 'submissions/demo-submission-2/processed-page-1.jpg', width: 867, height: 1156 }
      }
    ],
    type: [SubmissionPage],
    required: true
  })
  @Prop({ type: [SubmissionPage], required: true, default: [] })
  pages: SubmissionPage[];

  @ApiProperty({
    description: 'Order of page IDs for display in the UI',
    example: ['p1', 'p2', 'p3'],
    type: [String]
  })
  @Prop({ type: [String], default: [] })
  pageOrder: string[];

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
SubmissionSchema.index({ studentEmail: 1, taskId: 1 }, { unique: true }); 