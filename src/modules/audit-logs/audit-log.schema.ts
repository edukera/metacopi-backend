import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum TargetType {
  USER = 'User',
  CLASS = 'Class',
  TASK = 'Task',
  SUBMISSION = 'Submission',
  CORRECTION = 'Correction',
  MEMBERSHIP = 'Membership',
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class AuditLog {
  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String, required: true })
  action: string;

  @Prop({ 
    type: String, 
    enum: Object.values(TargetType),
    required: true 
  })
  targetType: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  targetId: string;

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export type AuditLogDocument = AuditLog & Document;
export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Create a composite index to improve search performance
AuditLogSchema.index({ targetType: 1, targetId: 1 });
AuditLogSchema.index({ email: 1 });
AuditLogSchema.index({ timestamp: -1 }); 