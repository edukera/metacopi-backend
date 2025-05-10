import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum MembershipRole {
  TEACHER = 'teacher',
  STUDENT = 'student',
}

export enum MembershipStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  REMOVED = 'removed',
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Membership {
  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String, required: true })
  classId: string;

  @Prop({
    type: String,
    enum: Object.values(MembershipRole),
    default: MembershipRole.STUDENT,
  })
  role: MembershipRole;

  @Prop({
    type: String,
    enum: Object.values(MembershipStatus),
    default: MembershipStatus.PENDING,
  })
  status: MembershipStatus;

  @Prop({ type: Date, default: Date.now })
  joinedAt: Date;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export type MembershipDocument = Membership & Document;
export const MembershipSchema = SchemaFactory.createForClass(Membership);

// Ensure uniqueness of the email-classId combination
MembershipSchema.index({ email: 1, classId: 1 }, { unique: true }); 