import { 
  IsString, 
  IsMongoId, 
  IsOptional, 
  IsNumber, 
  IsBoolean, 
  IsArray,
  Min
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Logical business identifier for the comment (unique)',
    example: 'COMM-2024-001',
    required: true
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'ID of the page in the submission where the comment is placed',
    example: 'p1'
  })
  @IsString()
  pageId: string;

  @ApiProperty({
    description: 'Vertical position of the comment on the page',
    example: 100
  })
  @IsNumber()
  pageY: number;

  @ApiProperty({
    description: 'Type of comment',
    example: 'highlight',
    default: 'note'
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: 'Color of the comment',
    example: '#FF5733',
    default: '#FFD700'
  })
  @IsString()
  color: string;

  @ApiProperty({
    description: 'Raw Markdown content, if different from plain text or if specific Markdown features are used',
    example: 'This section needs **more detailed** explanation. See [doc](...)'
  })
  @IsString()
  markdown: string;

  @ApiProperty({
    description: 'Text content of the comment',
    example: 'This section needs more detailed explanation.'
  })
  @IsString()
  text: string;

  @ApiProperty({
    description: 'Array of logical annotation IDs (not Mongo IDs) related to this comment',
    example: ['ANNOT-2024-001', 'ANNOT-2024-002'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  annotations: string[];

  @ApiPropertyOptional({
    description: 'ID of the AI source if this comment was generated from an AI',
    example: 'AIC-2024-001'
  })
  @IsOptional()
  @IsString()
  AISourceID?: string;

  @ApiPropertyOptional({
    description: 'Email of the user who created the comment. If not provided, will use the current authenticated user.',
    example: 'user@example.com'
  })
  @IsOptional()
  @IsString()
  createdByEmail?: string;
}

// Update DTO extends Create DTO with all fields optional
export class UpdateCommentDto extends PartialType(CreateCommentDto) {}

export class CommentResponseDto {
  @ApiProperty({
    description: 'Logical business identifier for the comment (unique)',
    example: 'COMM-2024-001'
  })
  id: string;

  @ApiProperty({
    description: 'Logical business ID of the correction this comment belongs to',
    example: 'CORR-2024-001'
  })
  correctionId: string;

  @ApiProperty({
    description: 'ID of the page in the submission where the comment is placed',
    example: 'p1'
  })
  pageId: string;

  @ApiProperty({
    description: 'Y position of the comment',
    example: 100
  })
  pageY: number;

  @ApiProperty({
    description: 'Type of comment',
    example: 'highlight'
  })
  type: string;

  @ApiProperty({
    description: 'Color of the comment',
    example: '#FF5733'
  })
  color: string;

  @ApiProperty({
    description: 'Raw Markdown content, if different from plain text or if specific Markdown features are used',
    example: 'This section needs **more detailed** explanation. See [doc](...)'
  })
  markdown: string;

  @ApiProperty({
    description: 'Text content of the comment',
    example: 'This section needs more detailed explanation.'
  })
  text: string;

  @ApiProperty({
    description: 'Array of logical annotation IDs (not Mongo IDs) related to this comment',
    example: ['ANNOT-2024-001', 'ANNOT-2024-002'],
    type: [String]
  })
  annotations: string[];

  @ApiPropertyOptional({
    description: 'ID of the AI source if this comment was generated from an AI',
    example: 'AIC-2024-001'
  })
  AISourceID?: string;

  @ApiProperty({
    description: 'Email of the user who created the comment',
    example: 'user@example.com'
  })
  createdByEmail: string;

  @ApiProperty({
    description: 'Comment creation date',
    example: '2023-01-01T12:00:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Comment last update date',
    example: '2023-01-01T12:00:00Z'
  })
  updatedAt: Date;
} 