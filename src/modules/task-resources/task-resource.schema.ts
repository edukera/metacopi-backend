import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

export enum ResourceType {
  FILE = 'file',
  LINK = 'link',
  TEXT = 'text',
  CODE = 'code'
}

export type TaskResourceDocument = TaskResource & Document;

@Schema({ 
  timestamps: true,
  versionKey: false,
})
export class TaskResource extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description: string;
  
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Task' })
  taskId: string;
  
  @Prop({ required: true, type: String, enum: Object.values(ResourceType) })
  type: ResourceType;
  
  @Prop({ type: String })
  url: string;
  
  @Prop({ type: String })
  content: string;
  
  @Prop({ type: String })
  filePath: string;
  
  @Prop({ type: String })
  mimeType: string;
  
  @Prop({ type: Number })
  fileSize: number;
  
  @Prop({ type: Boolean, default: false })
  isRequired: boolean;
  
  @Prop({ type: Number, default: 0 })
  order: number;
  
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const TaskResourceSchema = SchemaFactory.createForClass(TaskResource); 