import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum CorrectionStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

@Schema({
  timestamps: true,
})
export class Correction {
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'Submission', 
    required: true,
    unique: true
  })
  submissionId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  correctedById: string;

  @Prop({
    type: String,
    enum: Object.values(CorrectionStatus),
    default: CorrectionStatus.IN_PROGRESS,
  })
  status: CorrectionStatus;

  @Prop({ type: String, default: '' })
  annotations: string;

  @Prop({ type: Number })
  grade: number;

  @Prop({ type: String, default: '' })
  appreciation: string;

  @Prop({ type: Date })
  finalizedAt: Date;
}

export type CorrectionDocument = Correction & Document;
export const CorrectionSchema = SchemaFactory.createForClass(Correction); 