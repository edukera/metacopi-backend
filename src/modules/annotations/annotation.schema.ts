import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Annotation {
  @ApiProperty({
    description: 'Logical business identifier for the annotation (unique)',
    example: 'ANN-2024-001',
    required: true
  })
  @Prop({ type: String, required: true, unique: true, trim: true })
  id: string;

  @ApiProperty({
    description: 'Logical business ID of the correction associated with this annotation',
    example: 'CORR-2024-001',
    required: true
  })
  @Prop({ type: String, required: true, index: true })
  correctionId: string;

  @ApiProperty({
    description: 'ID of the page this annotation belongs to',
    example: 'p1',
    required: true
  })
  @Prop({ type: String, required: true })
  pageId: string;

  @ApiProperty({
    description: 'Valeur de l\'annotation (JSON sérialisé)',
    example: '{"type":"text","content":"Bonne approche","position":{"x":120,"y":250}}',
    required: true
  })
  @Prop({ 
    type: String, 
    required: true 
  })
  value: string;

  @ApiProperty({
    description: 'Email of the user who created the annotation',
    example: 'user@example.com',
    required: true
  })
  @Prop({ type: String, required: true })
  createdByEmail: string;
}

export type AnnotationDocument = Annotation & Document;
export const AnnotationSchema = SchemaFactory.createForClass(Annotation);

// SUPPRESSION de l'index obsolète sur { correctionId, key } 