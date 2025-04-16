import { Document } from 'mongoose';
import { SubmissionStatus } from './submission.schema';

export interface Submission extends Document {
  readonly studentId: string;
  readonly taskId: string;
  readonly uploadedBy: string;
  readonly status: SubmissionStatus;
  readonly rawPages: string[];
  readonly processedPages: string[];
  readonly submittedAt?: Date;
  readonly reviewedAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface SubmissionRepository {
  create(createSubmissionDto: any): Promise<Submission>;
  findAll(): Promise<Submission[]>;
  findById(id: string): Promise<Submission>;
  findByTask(taskId: string): Promise<Submission[]>;
  findByStudent(studentId: string): Promise<Submission[]>;
  findByStudentAndTask(studentId: string, taskId: string): Promise<Submission>;
  update(id: string, updateSubmissionDto: any): Promise<Submission>;
  remove(id: string): Promise<Submission>;
} 