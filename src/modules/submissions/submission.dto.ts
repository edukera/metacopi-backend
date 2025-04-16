import { IsArray, IsDateString, IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { SubmissionStatus } from './submission.schema';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubmissionDto {
  @ApiProperty({
    description: 'ID of the task associated with the submission',
    example: '605a1cb9d4d5d73598045619'
  })
  @IsMongoId()
  taskId: string;

  @ApiPropertyOptional({
    description: 'ID of the student submitting the work (can be automatically filled by the backend)',
    example: '605a1cb9d4d5d73598045618'
  })
  @IsOptional()
  @IsMongoId()
  studentId?: string; // Can be automatically filled by the backend

  @ApiProperty({
    description: 'List of URLs of raw (unprocessed) pages of the submission',
    example: ['https://example.com/storage/page1.jpg', 'https://example.com/storage/page2.jpg'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  rawPages: string[];

  @ApiPropertyOptional({
    description: 'List of URLs of processed pages of the submission',
    example: ['https://example.com/storage/processed_page1.jpg', 'https://example.com/storage/processed_page2.jpg'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  processedPages?: string[];

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
    description: 'List of URLs of raw (unprocessed) pages of the submission',
    example: ['https://example.com/storage/page1.jpg', 'https://example.com/storage/page2.jpg'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rawPages?: string[];

  @ApiPropertyOptional({
    description: 'List of URLs of processed pages of the submission',
    example: ['https://example.com/storage/processed_page1.jpg', 'https://example.com/storage/processed_page2.jpg'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  processedPages?: string[];

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
    description: 'Unique ID of the submission',
    example: '605a1cb9d4d5d73598045620'
  })
  id: string;

  @ApiProperty({
    description: 'ID of the student who submitted the work',
    example: '605a1cb9d4d5d73598045618'
  })
  studentId: string;

  @ApiProperty({
    description: 'ID of the task associated with the submission',
    example: '605a1cb9d4d5d73598045619'
  })
  taskId: string;

  @ApiProperty({
    description: 'ID of the user who uploaded the submission',
    example: '605a1cb9d4d5d73598045618'
  })
  uploadedBy: string;

  @ApiProperty({
    description: 'Current status of the submission',
    example: SubmissionStatus.SUBMITTED,
    enum: SubmissionStatus
  })
  status: SubmissionStatus;

  @ApiProperty({
    description: 'List of URLs of raw (unprocessed) pages of the submission',
    example: ['https://example.com/storage/page1.jpg', 'https://example.com/storage/page2.jpg'],
    type: [String]
  })
  rawPages: string[];

  @ApiProperty({
    description: 'List of URLs of processed pages of the submission',
    example: ['https://example.com/storage/processed_page1.jpg', 'https://example.com/storage/processed_page2.jpg'],
    type: [String]
  })
  processedPages: string[];

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