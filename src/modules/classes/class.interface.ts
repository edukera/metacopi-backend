import { Document } from 'mongoose';
import { CreateClassDto, UpdateClassDto } from './class.dto';

export interface Class extends Document {
  readonly name: string;
  readonly description: string;
  readonly createdBy: string;
  readonly archived: boolean;
  readonly code: string;
  readonly settings: Record<string, any>;
  readonly startDate?: Date;
  readonly endDate?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ClassRepository {
  create(createClassDto: CreateClassDto, userId: string): Promise<Class>;
  findAll(archived?: boolean): Promise<Class[]>;
  findById(id: string): Promise<Class>;
  findByCode(code: string): Promise<Class>;
  update(id: string, updateClassDto: UpdateClassDto): Promise<Class>;
  archive(id: string): Promise<Class>;
  regenerateCode(id: string): Promise<{ code: string }>;
  remove(id: string): Promise<Class>;
  joinClass(id: string, userId: string, code: string): Promise<void>;
} 