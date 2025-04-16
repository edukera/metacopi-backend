import { IsString, IsMongoId, IsOptional, IsEnum, IsBoolean, IsNumber, IsObject, IsUrl } from 'class-validator';
import { ResourceType } from './task-resource.schema';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskResourceDto {
  @ApiProperty({ description: 'Name of the resource', example: 'Project Instructions' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Description of the resource', example: 'Detailed instructions for completing the project' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'ID of the task this resource belongs to', example: '60d21b4667d0d8992e610c85' })
  @IsMongoId()
  taskId: string;

  @ApiProperty({
    description: 'Type of resource',
    enum: ResourceType,
    example: ResourceType.FILE
  })
  @IsEnum(ResourceType)
  type: ResourceType;

  @ApiPropertyOptional({
    description: 'URL of the resource (for link type)',
    example: 'https://example.com/resource'
  })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiPropertyOptional({
    description: 'Text content of the resource (for text type)',
    example: 'This is the content of the text resource'
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    description: 'File path for file type resources',
    example: 'tasks/resources/document.pdf'
  })
  @IsOptional()
  @IsString()
  filePath?: string;

  @ApiPropertyOptional({
    description: 'MIME type of the file',
    example: 'application/pdf'
  })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({
    description: 'Size of the file in bytes',
    example: 102400
  })
  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @ApiPropertyOptional({
    description: 'Whether this resource is required for completing the task',
    example: true,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Order of the resource in the list of task resources',
    example: 1
  })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiPropertyOptional({
    description: 'Additional metadata for the resource',
    example: { author: 'Teacher Name' }
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateTaskResourceDto {
  @ApiPropertyOptional({ description: 'Name of the resource', example: 'Updated Project Instructions' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the resource', example: 'Updated detailed instructions' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'ID of the task this resource belongs to', example: '60d21b4667d0d8992e610c85' })
  @IsOptional()
  @IsMongoId()
  taskId?: string;

  @ApiPropertyOptional({
    description: 'Type of resource',
    enum: ResourceType,
    example: ResourceType.FILE
  })
  @IsOptional()
  @IsEnum(ResourceType)
  type?: ResourceType;

  @ApiPropertyOptional({
    description: 'URL of the resource (for link type)',
    example: 'https://example.com/updated-resource'
  })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiPropertyOptional({
    description: 'Text content of the resource (for text type)',
    example: 'This is the updated content of the text resource'
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    description: 'File path for file type resources',
    example: 'tasks/resources/updated-document.pdf'
  })
  @IsOptional()
  @IsString()
  filePath?: string;

  @ApiPropertyOptional({
    description: 'MIME type of the file',
    example: 'application/pdf'
  })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({
    description: 'Size of the file in bytes',
    example: 153600
  })
  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @ApiPropertyOptional({
    description: 'Whether this resource is required for completing the task',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Order of the resource in the list of task resources',
    example: 2
  })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiPropertyOptional({
    description: 'Additional metadata for the resource',
    example: { updatedBy: 'Teacher Name' }
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
} 