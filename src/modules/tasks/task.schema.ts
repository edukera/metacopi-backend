import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

export enum TaskStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Schema({ timestamps: true })
export class Task extends Document {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description: string;
  
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Class' })
  classId: string;
  
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  createdBy: string;
  
  @Prop({
    type: String,
    enum: Object.values(TaskStatus),
    default: TaskStatus.DRAFT
  })
  status: TaskStatus;
  
  @Prop({ type: Date })
  dueDate: Date;
  
  @Prop({ type: Number, min: 0, default: 0 })
  points: number;
  
  @Prop({ type: [String], default: [] })
  tags: string[];
  
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
  
  @Prop({ type: Object, default: {} })
  settings: Record<string, any>;
}

export const TaskSchema = SchemaFactory.createForClass(Task); 