import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Schema({
  timestamps: true,
})
export class Annotation {
  @ApiProperty({
    description: 'ID de la correction associée à cette annotation',
    example: '60d21b4667d0d8992e610c85',
    required: true
  })
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'Correction', 
    required: true,
    index: true
  })
  correctionId: string;

  @ApiProperty({
    description: 'Clé unique générée par le frontend (UUID v4)',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    required: true
  })
  @Prop({ 
    type: String, 
    required: true,
    index: true
  })
  key: string;

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

  @ApiPropertyOptional({
    description: 'IDs des commentaires liés à cette annotation',
    example: ['60d21b4667d0d8992e610c86', '60d21b4667d0d8992e610c87'],
    type: [String]
  })
  @Prop({ 
    type: [String], 
    default: [] 
  })
  commentIds: string[];
}

export type AnnotationDocument = Annotation & Document;
export const AnnotationSchema = SchemaFactory.createForClass(Annotation);

// Ajouter un index composé sur correctionId et key pour des recherches efficaces
AnnotationSchema.index({ correctionId: 1, key: 1 }, { unique: true }); 