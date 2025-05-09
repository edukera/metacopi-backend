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

export class CreateAICommentDto {
  @ApiProperty({
    description: 'ID of the correction this AI comment belongs to',
    example: '605a1cb9d4d5d73598045618'
  })
  @IsMongoId()
  correctionId: string;

  @ApiProperty({
    description: 'Page number in the document where the AI comment is placed',
    example: 2
  })
  @IsNumber()
  @Min(1)
  pageNumber: number;

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

  @ApiPropertyOptional({
    description: 'Whether the AI comment text contains markdown formatting',
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  markdown?: boolean;

  @ApiProperty({
    description: 'Text content of the AI comment',
    example: 'This section needs more detailed explanation.'
  })
  @IsString()
  text: string;

  @ApiPropertyOptional({
    description: 'Array of annotation references or IDs related to this AI comment',
    example: ['60d21b4667d0d8992e610c85', '60d21b4667d0d8992e610c86'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  annotations?: string[];

  @ApiPropertyOptional({
    description: 'ID of the user who created the AI comment. If not provided, will use the current authenticated user.',
    example: '605a1cb9d4d5d73598045618'
  })
  @IsOptional()
  @IsMongoId()
  createdBy?: string;
}

// Update DTO extends Create DTO with all fields optional
export class UpdateAICommentDto extends PartialType(CreateAICommentDto) {}

export class AICommentResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the AI comment',
    example: '605a1cb9d4d5d73598045618'
  })
  id: string;

  @ApiProperty({
    description: 'ID of the correction this AI comment belongs to',
    example: '605a1cb9d4d5d73598045618'
  })
  correctionId: string;

  @ApiProperty({
    description: 'Page number in the document where the AI comment is placed',
    example: 2
  })
  pageNumber: number;

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
    description: 'Whether the AI comment text contains markdown formatting',
    example: false
  })
  markdown: boolean;

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
    description: 'ID of the user who created the AI comment',
    example: '605a1cb9d4d5d73598045618'
  })
  createdBy: string;

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