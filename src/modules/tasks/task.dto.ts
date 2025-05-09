import { IsString, IsMongoId, IsOptional, IsDate, IsNumber, IsEnum, IsArray, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { TaskStatus } from './task.schema';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({ description: 'Title of the task', example: 'Complete Project Phase 1' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Description of the task', example: 'Implement the core functionality of the project as described in the requirements document.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'ID of the class this task belongs to', example: '60d21b4667d0d8992e610c85' })
  @IsMongoId()
  classId: string;

  @ApiPropertyOptional({
    description: 'Status of the task',
    enum: TaskStatus,
    example: TaskStatus.DRAFT,
    default: TaskStatus.DRAFT
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({
    description: 'Due date of the task',
    example: '2023-12-31T23:59:59.999Z'
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @ApiPropertyOptional({
    description: 'Maximum points for the task',
    example: 100
  })
  @IsOptional()
  @IsNumber()
  points?: number;

  @ApiPropertyOptional({
    description: 'Tags associated with the task',
    example: ['programming', 'project', 'javascript']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Additional metadata for the task',
    example: { difficulty: 'medium', estimatedTime: '4 hours' }
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Settings for the task',
    example: { allowLateSubmissions: true, showPointsToStudents: false }
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}

export class UpdateTaskDto {
  @ApiPropertyOptional({ description: 'Updated title of the task', example: 'Updated: Complete Project Phase 1' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Updated description of the task', example: 'Updated implementation requirements for the project.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Updated status of the task',
    enum: TaskStatus,
    example: TaskStatus.PUBLISHED
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({
    description: 'Updated due date of the task',
    example: '2024-01-15T23:59:59.999Z'
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @ApiPropertyOptional({
    description: 'Updated maximum points for the task',
    example: 120
  })
  @IsOptional()
  @IsNumber()
  points?: number;

  @ApiPropertyOptional({
    description: 'Updated tags associated with the task',
    example: ['programming', 'advanced', 'javascript', 'project']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Updated additional metadata for the task',
    example: { difficulty: 'hard', estimatedTime: '6 hours' }
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Updated settings for the task',
    example: { allowLateSubmissions: false, showPointsToStudents: true }
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}

export class TaskResponseDto {
  @ApiProperty({ description: 'Unique task ID', example: '60d21b4667d0d8992e610c85' })
  id: string;

  @ApiProperty({ description: 'Title of the task', example: 'Complete Project Phase 1' })
  title: string;

  @ApiPropertyOptional({ description: 'Description of the task', example: 'Implement the core functionality of the project as described in the requirements document.' })
  description?: string;

  @ApiProperty({ description: 'ID of the class this task belongs to', example: '60d21b4667d0d8992e610c85' })
  classId: string;

  @ApiProperty({ description: 'ID of the user who created the task', example: '60d21b4667d0d8992e610c85' })
  createdBy: string;

  @ApiProperty({
    description: 'Status of the task',
    enum: TaskStatus,
    example: TaskStatus.PUBLISHED
  })
  status: TaskStatus;

  @ApiPropertyOptional({
    description: 'Due date of the task',
    example: '2023-12-31T23:59:59.999Z'
  })
  dueDate?: Date;

  @ApiProperty({
    description: 'Maximum points for the task',
    example: 100
  })
  points: number;

  @ApiProperty({
    description: 'Tags associated with the task',
    example: ['programming', 'project', 'javascript']
  })
  tags: string[];

  @ApiProperty({
    description: 'Additional metadata for the task',
    example: { difficulty: 'medium', estimatedTime: '4 hours' }
  })
  metadata: Record<string, any>;

  @ApiProperty({
    description: 'Settings for the task',
    example: { allowLateSubmissions: true, showPointsToStudents: false }
  })
  settings: Record<string, any>;

  @ApiProperty({
    description: 'Task creation date',
    example: '2023-01-01T12:00:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Task last update date',
    example: '2023-01-01T12:00:00Z'
  })
  updatedAt: Date;
} 