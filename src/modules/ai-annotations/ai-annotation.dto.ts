import { IsArray, IsMongoId, IsNotEmpty, IsOptional, IsString, IsUUID, Validate } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsValidJson } from '../annotations/validators/is-valid-json.validator';

export class CreateAIAnnotationDto {
  @ApiProperty({
    description: 'Logical business ID of the correction associated with this AI annotation',
    example: 'CORR-2024-001'
  })
  @IsString()
  correctionId: string;

  @ApiProperty({
    description: 'Valeur de l\'annotation générée par l\'IA (JSON sérialisé)',
    example: '{"type":"text","content":"Bonne approche IA","position":{"x":120,"y":250}}'
  })
  @IsString()
  @IsNotEmpty()
  @Validate(IsValidJson)
  value: string;

  @ApiPropertyOptional({
    description: 'Email of the user or system who created the AI annotation. If not provided, will use the current authenticated user or system.',
    example: 'ai-system@example.com'
  })
  @IsOptional()
  @IsString()
  createdByEmail?: string;

  @ApiProperty({
    description: 'Logical business identifier for the AI annotation (must be unique)',
    example: 'AIANN-2024-001',
    required: true
  })
  @IsString()
  id: string;

  @ApiPropertyOptional({
    description: 'Array of logical AI annotation IDs (not Mongo IDs) related to this annotation',
    example: ['AIANN-2024-001', 'AIANN-2024-002'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  annotations?: string[];
}

export class UpdateAIAnnotationDto {
  @ApiPropertyOptional({
    description: 'Valeur mise à jour de l\'annotation générée par l\'IA (JSON sérialisé)',
    example: '{"type":"text","content":"Excellente approche IA","position":{"x":120,"y":250}}'
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Validate(IsValidJson)
  value?: string;
}

export class AIAnnotationResponseDto {
  @ApiProperty({
    description: 'Logical business identifier for the AI annotation (unique)',
    example: 'AIANN-2024-001'
  })
  id: string;

  @ApiProperty({
    description: 'Logical business ID of the correction associated with this AI annotation',
    example: 'CORR-2024-001'
  })
  correctionId: string;

  @ApiProperty({
    description: 'Valeur de l\'annotation générée par l\'IA (JSON sérialisé)',
    example: '{"type":"text","content":"Bonne approche IA","position":{"x":120,"y":250}}'
  })
  value: string;

  @ApiProperty({
    description: 'Date de création de l\'annotation IA',
    example: '2023-01-01T12:00:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date de dernière mise à jour de l\'annotation IA',
    example: '2023-01-01T12:00:00Z'
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Email of the user or system who created the AI annotation',
    example: 'ai-system@example.com'
  })
  createdByEmail: string;

  @ApiPropertyOptional({
    description: 'Array of logical AI annotation IDs (not Mongo IDs) related to this annotation',
    example: ['AIANN-2024-001', 'AIANN-2024-002'],
    type: [String]
  })
  annotations?: string[];
} 