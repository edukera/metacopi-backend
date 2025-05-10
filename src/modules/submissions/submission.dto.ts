import { IsArray, IsDateString, IsEnum, IsMongoId, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { SubmissionStatus } from './submission.schema';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmissionPageDto {
  @ApiProperty({ description: 'Page unique identifier', example: 'p1' })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Raw image info',
    example: { image_path: 'submissions/demo-submission-2/raw-page-1.jpg', width: 3468, height: 4624 }
  })
  @IsNotEmpty()
  raw: { image_path: string; width: number; height: number };

  @ApiProperty({
    description: 'Processed image info',
    example: { image_path: 'submissions/demo-submission-2/processed-page-1.jpg', width: 867, height: 1156 }
  })
  @IsNotEmpty()
  processed: { image_path: string; width: number; height: number };
}

export class CreateSubmissionDto {
  @ApiProperty({
    description: 'Logical business identifier for the submission (must be unique)',
    example: 'SUB-2024-001',
    required: true
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Logical business ID of the task associated with the submission',
    example: 'TASK-2024-001'
  })
  @IsString()
  taskId: string;

  @ApiPropertyOptional({
    description: 'Email of the student submitting the work (can be automatically filled by the backend)',
    example: 'student@example.com'
  })
  @IsOptional()
  @IsString()
  studentEmail?: string; // Remplace studentId

  @ApiProperty({
    description: 'List of pages (raw and processed info)',
    example: [
      {
        id: 'p1',
        raw: { image_path: 'submissions/demo-submission-2/raw-page-1.jpg', width: 3468, height: 4624 },
        processed: { image_path: 'submissions/demo-submission-2/processed-page-1.jpg', width: 867, height: 1156 }
      }
    ],
    type: [SubmissionPageDto],
    required: true
  })
  @IsArray()
  @IsNotEmpty({ each: true })
  pages: SubmissionPageDto[];

  @ApiPropertyOptional({
    description: 'Initial status of the submission',
    example: SubmissionStatus.DRAFT,
    enum: SubmissionStatus,
    default: SubmissionStatus.DRAFT
  })
  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus;
}

export class UpdateSubmissionDto {
  @ApiPropertyOptional({
    description: 'List of pages (raw and processed info)',
    example: [
      {
        id: 'p1',
        raw: { image_path: 'submissions/demo-submission-2/raw-page-1.jpg', width: 3468, height: 4624 },
        processed: { image_path: 'submissions/demo-submission-2/processed-page-1.jpg', width: 867, height: 1156 }
      }
    ],
    type: [SubmissionPageDto],
    required: true
  })
  @IsOptional()
  @IsArray()
  @IsNotEmpty({ each: true })
  pages: SubmissionPageDto[];

  @ApiPropertyOptional({
    description: 'New status of the submission',
    example: SubmissionStatus.SUBMITTED,
    enum: SubmissionStatus
  })
  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus;

  @ApiPropertyOptional({
    description: 'Date when the submission was submitted for correction',
    example: '2023-01-15T10:30:00Z'
  })
  @IsOptional()
  @IsDateString()
  submittedAt?: Date;

  @ApiPropertyOptional({
    description: 'Date when the submission was reviewed/corrected',
    example: '2023-01-20T14:45:00Z'
  })
  @IsOptional()
  @IsDateString()
  reviewedAt?: Date;
}

export class SubmissionResponseDto {
  @ApiProperty({
    description: 'Logical business identifier for the submission (unique)',
    example: 'SUB-2024-001'
  })
  id: string;

  @ApiProperty({
    description: 'Email of the student who submitted the work',
    example: 'student@example.com'
  })
  studentEmail: string;

  @ApiProperty({
    description: 'Logical business ID of the task associated with the submission',
    example: 'TASK-2024-001'
  })
  @IsString()
  taskId: string;

  @ApiProperty({
    description: 'Email of the user who uploaded the submission',
    example: 'teacher@example.com'
  })
  uploadedByEmail: string;

  @ApiProperty({
    description: 'Current status of the submission',
    example: SubmissionStatus.SUBMITTED,
    enum: SubmissionStatus
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
    type: [SubmissionPageDto],
    required: true
  })
  pages: SubmissionPageDto[];

  @ApiPropertyOptional({
    description: 'Date when the submission was submitted for correction',
    example: '2023-01-15T10:30:00Z'
  })
  submittedAt?: Date;

  @ApiPropertyOptional({
    description: 'Date when the submission was reviewed/corrected',
    example: '2023-01-20T14:45:00Z'
  })
  reviewedAt?: Date;

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