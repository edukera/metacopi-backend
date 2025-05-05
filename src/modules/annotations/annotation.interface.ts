import { Document } from 'mongoose';

export interface Annotation extends Document {
  readonly correctionId: string;
  readonly key: string;
  readonly value: string;
  readonly commentIds: string[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface AnnotationRepository {
  create(createAnnotationDto: any): Promise<Annotation>;
  findAll(): Promise<Annotation[]>;
  findById(id: string): Promise<Annotation>;
  findByCorrection(correctionId: string): Promise<Annotation[]>;
  findByKey(correctionId: string, key: string): Promise<Annotation>;
  update(id: string, updateAnnotationDto: any): Promise<Annotation>;
  remove(id: string): Promise<Annotation>;
} 