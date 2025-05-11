import { IsArray, IsMongoId, IsNotEmpty, IsOptional, IsString, IsUUID, Validate } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsValidJson } from './validators/is-valid-json.validator';

export class CreateAnnotationDto {
  @ApiProperty({
    description: 'Logical business ID of the correction associated with this annotation',
    example: 'CORR-2024-001'
  })
  @IsString()
  correctionId: string;

  @ApiProperty({
    description: 'ID of the page this annotation belongs to',
    example: 'p1'
  })
  @IsString()
  @IsNotEmpty()
  pageId: string;

  @ApiProperty({
    description: 'Valeur de l\'annotation (JSON sérialisé)',
    example: '{"type":"text","content":"Bonne approche","position":{"x":120,"y":250}}'
  })
  @IsString()
  @IsNotEmpty()
  @Validate(IsValidJson)
  value: string;

  @ApiPropertyOptional({
    description: 'Email of the user who created the annotation. If not provided, will use the current authenticated user.',
    example: 'user@example.com'
  })
  @IsOptional()
  @IsString()
  createdByEmail?: string;

  @ApiProperty({
    description: 'Logical business identifier for the annotation (must be unique)',
    example: 'ANN-2024-001',
    required: true
  })
  @IsString()
  id: string;
}

export class UpdateAnnotationDto {
  @ApiPropertyOptional({
    description: 'Valeur mise à jour de l\'annotation (JSON sérialisé)',
    example: '{"type":"text","content":"Excellente approche","position":{"x":120,"y":250}}'
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Validate(IsValidJson)
  value?: string;

  @ApiPropertyOptional({
    description: 'ID of the page this annotation belongs to',
    example: 'p1'
  })
  @IsOptional()
  @IsString()
  pageId?: string;
}

export class AnnotationResponseDto {
  @ApiProperty({
    description: 'Logical business identifier for the annotation (unique)',
    example: 'ANN-2024-001'
  })
  id: string;

  @ApiProperty({
    description: 'Logical business ID of the correction associated with this annotation',
    example: 'CORR-2024-001'
  })
  correctionId: string;

  @ApiProperty({
    description: 'ID of the page this annotation belongs to',
    example: 'p1'
  })
  pageId: string;

  @ApiProperty({
    description: 'Valeur de l\'annotation (JSON sérialisé)',
    example: '{"type":"text","content":"Bonne approche","position":{"x":120,"y":250}}'
  })
  value: string;

  @ApiProperty({
    description: 'Date de création de l\'annotation',
    example: '2023-01-01T12:00:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date de dernière mise à jour de l\'annotation',
    example: '2023-01-01T12:00:00Z'
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Email of the user who created the annotation',
    example: 'user@example.com'
  })
  createdByEmail: string;
} 