import { IsArray, IsMongoId, IsNotEmpty, IsOptional, IsString, IsUUID, Validate } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsValidJson } from './validators/is-valid-json.validator';

export class CreateAnnotationDto {
  @ApiProperty({
    description: 'ID de la correction associée à cette annotation',
    example: '60d21b4667d0d8992e610c85'
  })
  @IsMongoId()
  correctionId: string;

  @ApiProperty({
    description: 'Clé unique générée par le frontend (UUID v4)',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
  })
  @IsUUID('4')
  @IsNotEmpty()
  key: string;

  @ApiProperty({
    description: 'Valeur de l\'annotation (JSON sérialisé)',
    example: '{"type":"text","content":"Bonne approche","position":{"x":120,"y":250}}'
  })
  @IsString()
  @IsNotEmpty()
  @Validate(IsValidJson)
  value: string;

  @ApiPropertyOptional({
    description: 'IDs des commentaires liés à cette annotation',
    example: ['60d21b4667d0d8992e610c86', '60d21b4667d0d8992e610c87'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  commentIds?: string[];
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
    description: 'IDs mis à jour des commentaires liés à cette annotation',
    example: ['60d21b4667d0d8992e610c86', '60d21b4667d0d8992e610c87'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  commentIds?: string[];
}

export class AnnotationResponseDto {
  @ApiProperty({
    description: 'ID unique de l\'annotation',
    example: '60d21b4667d0d8992e610c88'
  })
  id: string;

  @ApiProperty({
    description: 'ID de la correction associée à cette annotation',
    example: '60d21b4667d0d8992e610c85'
  })
  correctionId: string;

  @ApiProperty({
    description: 'Clé unique générée par le frontend (UUID v4)',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
  })
  key: string;

  @ApiProperty({
    description: 'Valeur de l\'annotation (JSON sérialisé)',
    example: '{"type":"text","content":"Bonne approche","position":{"x":120,"y":250}}'
  })
  value: string;

  @ApiProperty({
    description: 'IDs des commentaires liés à cette annotation',
    example: ['60d21b4667d0d8992e610c86', '60d21b4667d0d8992e610c87'],
    type: [String]
  })
  commentIds: string[];

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
} 