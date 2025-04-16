import { Document } from 'mongoose';
import { CorrectionStatus } from './correction.schema';

export interface Correction extends Document {
  readonly submissionId: string;
  readonly correctedById: string;
  readonly status: CorrectionStatus;
  readonly annotations: string;
  readonly grade: number;
  readonly appreciation: string;
  readonly finalizedAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CorrectionRepository {
  create(createCorrectionDto: any): Promise<Correction>;
  findAll(): Promise<Correction[]>;
  findById(id: string): Promise<Correction>;
  findBySubmission(submissionId: string): Promise<Correction>;
  findByTeacher(teacherId: string): Promise<Correction[]>;
  update(id: string, updateCorrectionDto: any): Promise<Correction>;
  remove(id: string): Promise<Correction>;
} 