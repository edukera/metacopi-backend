import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

export enum TaskStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Task extends Document {
  @Prop({ required: true, unique: true, trim: true })
  id: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description: string;
  
  @Prop({ required: true, type: String })
  classId: string;
  
  @Prop({ required: true, trim: true })
  createdByEmail: string;
  
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
  
  @Prop({ required: true, trim: true })
  utterance: string;
  
  @Prop({ type: [String], default: [] })
  tags: string[];
  
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
  
  @Prop({ type: Object, default: {} })
  settings: Record<string, any>;
}

export const TaskSchema = SchemaFactory.createForClass(Task); 