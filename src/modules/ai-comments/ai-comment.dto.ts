import { 
  IsString, 
  IsMongoId, 
  IsOptional, 
  IsNumber, 
  IsBoolean, 
  IsArray,
  Min,
  IsEnum
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum AICommentStatus {
  VALIDATED = 'validated',
  REJECTED = 'rejected',
  PENDING = 'pending'
}

export class CreateAICommentDto {
  @ApiProperty({
    description: 'Logical business identifier for the AI comment (must be unique)',
    example: 'AIC-2024-001',
    required: true
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Logical business ID of the correction this AI comment belongs to',
    example: 'CORR-2024-001'
  })
  @IsString()
  @IsOptional()
  correctionId?: string;

  @ApiProperty({
    description: 'ID of the page in the submission where the AI comment is placed',
    example: 'p1'
  })
  @IsString()
  pageId: string;

  @ApiPropertyOptional({
    description: 'Type of AI comment (e.g., highlight, note, annotation)',
    example: 'highlight',
    default: 'note'
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'Color of the AI comment (hex code or named color)',
    example: '#FF5733',
    default: '#FFD700'
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({
    description: 'Raw Markdown content, if different from plain text or if specific Markdown features are used',
    example: 'This section needs **more detailed** explanation. See [doc](...)',
    default: 'note'
  })
  @IsString()
  markdown: string;

  @ApiProperty({
    description: 'Text content of the AI comment',
    example: 'This section needs more detailed explanation.'
  })
  @IsString()
  text: string;

  @ApiProperty({
    description: 'Array of annotation references or IDs related to this AI comment',
    example: ['60d21b4667d0d8992e610c85', '60d21b4667d0d8992e610c86'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  annotations: string[];

  @ApiProperty({
    description: 'Status of the AI comment (validated, rejected, pending)',
    example: 'pending',
    default: 'pending',
    enum: AICommentStatus
  })
  @IsEnum(AICommentStatus)
  status: AICommentStatus = AICommentStatus.PENDING;

  @ApiProperty({
    description: 'Vertical position of the AI comment on the page, if applicable',
    example: 120.5
  })
  @IsNumber()
  pageY: number;

  @ApiPropertyOptional({
    description: 'Email of the user who created the AI comment. If not provided, will use the current authenticated user.',
    example: 'user@example.com'
  })
  @IsOptional()
  @IsString()
  createdByEmail?: string;
}

// Update DTO extends Create DTO with all fields optional
export class UpdateAICommentDto extends PartialType(CreateAICommentDto) {}

export class AICommentResponseDto {
  @ApiProperty({
    description: 'Logical business identifier for the AI comment (unique)',
    example: 'AIC-2024-001'
  })
  id: string;

  @ApiProperty({
    description: 'Logical business ID of the correction this AI comment belongs to',
    example: 'CORR-2024-001'
  })
  correctionId: string;

  @ApiProperty({
    description: 'ID of the page in the submission where the AI comment is placed',
    example: 'p1'
  })
  pageId: string;

  @ApiProperty({
    description: 'Y position of the AI comment',
    example: 100
  })
  pageY: number;

  @ApiProperty({
    description: 'Type of AI comment',
    example: 'highlight'
  })
  type: string;

  @ApiProperty({
    description: 'Color of the AI comment',
    example: '#FF5733'
  })
  color: string;

  @ApiProperty({
    description: 'Raw Markdown content of the AI comment',
    example: 'This section needs **more detailed** explanation. See [doc](...)'
  })
  markdown: string;

  @ApiProperty({
    description: 'Text content of the AI comment',
    example: 'This section needs more detailed explanation.'
  })
  text: string;

  @ApiProperty({
    description: 'Array of annotation references or IDs related to this AI comment',
    example: ['60d21b4667d0d8992e610c85', '60d21b4667d0d8992e610c86'],
    type: [String]
  })
  annotations: string[];

  @ApiProperty({
    description: 'Status of the AI comment (validated, rejected, pending)',
    example: 'pending',
    enum: AICommentStatus
  })
  status: AICommentStatus;

  @ApiProperty({
    description: 'Email of the user who created the AI comment',
    example: 'user@example.com'
  })
  createdByEmail: string;

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