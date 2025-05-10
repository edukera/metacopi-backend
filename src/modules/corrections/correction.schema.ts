import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum CorrectionStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Correction {
  @Prop({ type: String, required: true, unique: true, trim: true })
  id: string;

  @Prop({ type: String, required: true, unique: true })
  submissionId: string;

  @Prop({ type: String, required: true })
  correctedByEmail: string;

  @Prop({
    type: String,
    enum: Object.values(CorrectionStatus),
    default: CorrectionStatus.IN_PROGRESS,
  })
  status: CorrectionStatus;

  @Prop({ type: Number })
  grade: number;

  @Prop({ type: String, default: '' })
  appreciation: string;

  @Prop({ type: Date })
  finalizedAt: Date;
}

export type CorrectionDocument = Correction & Document;
export const CorrectionSchema = SchemaFactory.createForClass(Correction); 