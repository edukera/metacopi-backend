import { IsDateString, IsEnum, IsMongoId, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { CorrectionStatus } from './correction.schema';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCorrectionDto {
  @ApiProperty({ description: 'ID of the submission to correct', example: '60d21b4667d0d8992e610c85' })
  @IsMongoId()
  submissionId: string;

  @ApiPropertyOptional({ description: 'ID of the user who corrected the submission (can be automatically filled by the backend)', example: '60d21b4667d0d8992e610c86' })
  @IsOptional()
  @IsMongoId()
  correctedById?: string; // Can be automatically filled by the backend

  @ApiPropertyOptional({ description: 'Annotations or comments on the submission', example: 'Good work on implementing the core functionality, but needs improvement in error handling.' })
  @IsOptional()
  @IsString()
  annotations?: string;

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
    description: 'Status of the correction',
    enum: CorrectionStatus,
    example: CorrectionStatus.IN_PROGRESS
  })
  @IsOptional()
  @IsEnum(CorrectionStatus)
  status?: CorrectionStatus;
}

export class UpdateCorrectionDto {
  @ApiPropertyOptional({ description: 'Updated annotations or comments on the submission', example: 'Updated: Good work but could improve code organization.' })
  @IsOptional()
  @IsString()
  annotations?: string;

  @ApiPropertyOptional({ 
    description: 'Updated grade for the submission (0-20)',
    minimum: 0,
    maximum: 20,
    example: 16
  })
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
  @ApiProperty({ description: 'Unique ID of the correction', example: '60d21b4667d0d8992e610c87' })
  id: string;

  @ApiProperty({ description: 'ID of the submission being corrected', example: '60d21b4667d0d8992e610c85' })
  submissionId: string;

  @ApiProperty({ description: 'ID of the user who corrected the submission', example: '60d21b4667d0d8992e610c86' })
  correctedById: string;

  @ApiProperty({ 
    description: 'Status of the correction',
    enum: CorrectionStatus,
    example: CorrectionStatus.COMPLETED
  })
  status: CorrectionStatus;

  @ApiPropertyOptional({ description: 'Annotations or comments on the submission', example: 'Good work on implementing the core functionality, but needs improvement in error handling.' })
  annotations?: string;

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