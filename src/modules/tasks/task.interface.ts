import { Document } from 'mongoose';
import { CreateTaskDto, UpdateTaskDto } from './task.dto';
import { TaskStatus } from './task.schema';

export interface Task extends Document {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly classId: string;
  readonly createdByEmail: string;
  readonly status: TaskStatus;
  readonly dueDate: Date;
  readonly points: number;
  readonly utterance: string;
  readonly tags: string[];
  readonly metadata: Record<string, any>;
  readonly settings: Record<string, any>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface TaskRepository {
  create(createTaskDto: CreateTaskDto, userId: string): Promise<Task>;
  findAll(filters?: Record<string, any>): Promise<Task[]>;
  findById(id: string): Promise<Task>;
  findByClass(classId: string): Promise<Task[]>;
  update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task>;
  archive(id: string): Promise<Task>;
  remove(id: string): Promise<Task>;
} 