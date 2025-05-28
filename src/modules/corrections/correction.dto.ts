import { IsDateString, IsEnum, IsMongoId, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { CorrectionStatus } from './correction.schema';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCorrectionDto {
  @ApiProperty({
    description: 'Logical business identifier for the correction (must be unique)',
    example: 'CORR-2024-001',
    required: true
  })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Logical business ID of the submission to correct', example: 'SUB-2024-001' })
  @IsString()
  submissionId: string;

  @ApiPropertyOptional({ description: 'Email of the user who corrected the submission (can be automatically filled by the backend)', example: 'teacher@example.com' })
  @IsOptional()
  @IsString()
  correctedByEmail?: string;

  @ApiPropertyOptional({ 
    description: 'Grade for the submission (0-20)',
    minimum: 0,
    maximum: 20,
    example: 15
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(20)
  grade?: number;

  @ApiPropertyOptional({ description: 'General appreciation of the submission', example: 'Excellent work overall.' })
  @IsOptional()
  @IsString()
  appreciation?: string;

  @ApiPropertyOptional({ 
    description: 'Scores for individual questions in JSON format',
    example: '{"qa-1": 2, "qa-2": 1.5, "qb": 0}'
  })
  @IsOptional()
  @IsString()
  scores?: string;

  @ApiPropertyOptional({ 
    description: 'Status of the correction',
    enum: CorrectionStatus,
    example: CorrectionStatus.IN_PROGRESS
  })
  @IsOptional()
  @IsEnum(CorrectionStatus)
  status?: CorrectionStatus;
}

export class UpdateCorrectionDto {
  @ApiPropertyOptional({ description: 'Updated grade for the submission (0-20)', minimum: 0, maximum: 20, example: 16 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(20)
  grade?: number;

  @ApiPropertyOptional({ description: 'Updated general appreciation of the submission', example: 'Very good work with excellent attention to detail.' })
  @IsOptional()
  @IsString()
  appreciation?: string;

  @ApiPropertyOptional({ 
    description: 'Updated scores for individual questions in JSON format',
    example: '{"qa-1": 2, "qa-2": 1.5, "qb": 0}'
  })
  @IsOptional()
  @IsString()
  scores?: string;

  @ApiPropertyOptional({ 
    description: 'Updated status of the correction',
    enum: CorrectionStatus,
    example: CorrectionStatus.COMPLETED
  })
  @IsOptional()
  @IsEnum(CorrectionStatus)
  status?: CorrectionStatus;

  @ApiPropertyOptional({ 
    description: 'Date when the correction was finalized',
    example: '2023-12-15T12:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  finalizedAt?: Date;
}

export class CorrectionResponseDto {
  @ApiProperty({
    description: 'Logical business identifier for the correction (unique)',
    example: 'CORR-2024-001'
  })
  id: string;

  @ApiProperty({ description: 'ID of the submission being corrected', example: '60d21b4667d0d8992e610c85' })
  submissionId: string;

  @ApiProperty({ description: 'Email of the user who corrected the submission', example: 'teacher@example.com' })
  correctedByEmail: string;

  @ApiProperty({ 
    description: 'Status of the correction',
    enum: CorrectionStatus,
    example: CorrectionStatus.COMPLETED
  })
  status: CorrectionStatus;

  @ApiPropertyOptional({ 
    description: 'Grade for the submission (0-20)',
    minimum: 0,
    maximum: 20,
    example: 15
  })
  grade?: number;

  @ApiPropertyOptional({ description: 'General appreciation of the submission', example: 'Excellent work overall.' })
  appreciation?: string;

  @ApiPropertyOptional({ 
    description: 'Scores for individual questions in JSON format',
    example: '{"qa-1": 2, "qa-2": 1.5, "qb": 0}'
  })
  scores?: string;

  @ApiPropertyOptional({ 
    description: 'Date when the correction was finalized',
    example: '2023-12-15T12:00:00.000Z'
  })
  finalizedAt?: Date;

  @ApiProperty({
    description: 'Creation date of the correction',
    example: '2023-01-01T12:00:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date of the correction',
    example: '2023-01-01T12:00:00Z'
  })
  updatedAt: Date;
} 