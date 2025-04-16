import { Document } from 'mongoose';
import { CreateTaskResourceDto, UpdateTaskResourceDto } from './task-resource.dto';
import { ResourceType } from './task-resource.schema';

export interface TaskResource extends Document {
  readonly name: string;
  readonly description: string;
  readonly taskId: string;
  readonly type: ResourceType;
  readonly url: string;
  readonly content: string;
  readonly filePath: string;
  readonly mimeType: string;
  readonly fileSize: number;
  readonly isRequired: boolean;
  readonly order: number;
  readonly metadata: Record<string, any>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface TaskResourceRepository {
  create(createTaskResourceDto: CreateTaskResourceDto): Promise<TaskResource>;
  findAll(filters?: Record<string, any>): Promise<TaskResource[]>;
  findById(id: string): Promise<TaskResource>;
  findByTask(taskId: string): Promise<TaskResource[]>;
  update(id: string, updateTaskResourceDto: UpdateTaskResourceDto): Promise<TaskResource>;
  remove(id: string): Promise<TaskResource>;
  reorder(taskId: string, resourceIds: string[]): Promise<TaskResource[]>;
} 