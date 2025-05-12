import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AIAnnotationStatus } from './ai-annotation.dto';

@Schema({
  timestamps: true,
  versionKey: false,
})
export class AIAnnotation {
  @ApiProperty({
    description: 'Logical business identifier for the AI annotation (unique)',
    example: 'AIANN-2024-001',
    required: true
  })
  @Prop({ type: String, required: true, unique: true, trim: true })
  id: string;

  @ApiProperty({
    description: 'Logical business ID of the correction associated with this AI annotation',
    example: 'CORR-2024-001',
    required: true
  })
  @Prop({ type: String, required: true, index: true })
  correctionId: string;

  @ApiProperty({
    description: 'ID of the page this AI annotation belongs to',
    example: 'p1',
    required: true
  })
  @Prop({ type: String, required: true })
  pageId: string;

  @ApiProperty({
    description: 'Valeur de l\'annotation générée par l\'IA (JSON sérialisé)',
    example: '{"type":"text","content":"Bonne approche IA","position":{"x":120,"y":250}}',
    required: true
  })
  @Prop({ 
    type: String, 
    required: true 
  })
  value: string;

  @ApiProperty({
    description: 'Email of the user or system who created the AI annotation',
    example: 'ai-system@example.com',
    required: true
  })
  @Prop({ type: String, required: true })
  createdByEmail: string;

  @ApiProperty({
    description: 'Status of the AI annotation (validated, rejected, pending)',
    example: 'pending',
    default: 'pending',
    enum: AIAnnotationStatus
  })
  @Prop({ type: String, enum: Object.values(AIAnnotationStatus), default: AIAnnotationStatus.PENDING })
  status: AIAnnotationStatus;

  @ApiPropertyOptional({
    description: 'Array of logical AI annotation IDs (not Mongo IDs) related to this annotation',
    example: ['AIANN-2024-001', 'AIANN-2024-002'],
    type: [String]
  })
  @Prop({ type: [String], default: [] })
  annotations?: string[];

  // Timestamps are added automatically by { timestamps: true }
  @ApiProperty({
    description: 'AI annotation creation date',
    example: '2023-01-01T12:00:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'AI annotation last update date',
    example: '2023-01-01T12:00:00Z'
  })
  updatedAt: Date;
}

export type AIAnnotationDocument = AIAnnotation & Document;
export const AIAnnotationSchema = SchemaFactory.createForClass(AIAnnotation); 