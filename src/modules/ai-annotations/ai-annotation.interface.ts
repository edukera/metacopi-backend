import { Document } from 'mongoose';

export interface AIAnnotation extends Document {
  readonly correctionId: string;
  readonly value: string;
  readonly createdByEmail: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly id: string;
}

export interface AIAnnotationRepository {
  create(createAIAnnotationDto: any): Promise<AIAnnotation>;
  findAll(): Promise<AIAnnotation[]>;
  findById(id: string): Promise<AIAnnotation>;
  findByCorrection(correctionId: string): Promise<AIAnnotation[]>;
  update(id: string, updateAIAnnotationDto: any): Promise<AIAnnotation>;
  remove(id: string): Promise<AIAnnotation>;
} 