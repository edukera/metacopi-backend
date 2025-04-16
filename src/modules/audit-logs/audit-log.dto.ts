import { IsDate, IsEnum, IsMongoId, IsObject, IsOptional, IsString } from 'class-validator';
import { TargetType } from './audit-log.schema';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAuditLogDto {
  @ApiPropertyOptional({ 
    description: 'ID of the user who performed the action',
    example: '60d21b4667d0d8992e610c85'
  })
  @IsOptional()
  @IsMongoId()
  userId?: string; // Can be automatically filled by the backend

  @ApiProperty({ 
    description: 'The action performed',
    example: 'CREATE_TASK'
  })
  @IsString()
  action: string;

  @ApiProperty({ 
    description: 'Type of the target entity',
    enum: TargetType,
    example: 'TASK'
  })
  @IsEnum(TargetType)
  targetType: TargetType;

  @ApiProperty({ 
    description: 'ID of the target entity',
    example: '60d21b4667d0d8992e610c86'
  })
  @IsMongoId()
  targetId: string;

  @ApiPropertyOptional({ 
    description: 'Timestamp of when the action occurred',
    example: '2023-12-15T12:00:00.000Z'
  })
  @IsOptional()
  @IsDate()
  timestamp?: Date;

  @ApiPropertyOptional({ 
    description: 'Additional metadata about the action',
    example: { oldValue: 'draft', newValue: 'published' }
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class FindAuditLogsDto {
  @ApiPropertyOptional({ 
    description: 'Filter logs by user ID',
    example: '60d21b4667d0d8992e610c85'
  })
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @ApiPropertyOptional({ 
    description: 'Filter logs by action type',
    example: 'UPDATE_TASK'
  })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ 
    description: 'Filter logs by target entity type',
    enum: TargetType,
    example: 'TASK'
  })
  @IsOptional()
  @IsEnum(TargetType)
  targetType?: TargetType;

  @ApiPropertyOptional({ 
    description: 'Filter logs by target entity ID',
    example: '60d21b4667d0d8992e610c86'
  })
  @IsOptional()
  @IsMongoId()
  targetId?: string;

  @ApiPropertyOptional({ 
    description: 'Filter logs from this date',
    example: '2023-12-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDate()
  fromDate?: Date;

  @ApiPropertyOptional({ 
    description: 'Filter logs until this date',
    example: '2023-12-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDate()
  toDate?: Date;
} 