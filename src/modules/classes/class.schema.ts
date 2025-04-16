import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Schema({ timestamps: true })
export class Class extends Document {
  @ApiProperty({
    description: 'Class name',
    example: 'Mathematics 101',
    required: true
  })
  @Prop({ required: true, trim: true })
  name: string;

  @ApiPropertyOptional({
    description: 'Class description',
    example: 'Introduction to mathematics course'
  })
  @Prop({ trim: true })
  description: string;

  @ApiProperty({
    description: 'ID of the user who created the class',
    example: '605a1cb9d4d5d73598045618',
    required: true
  })
  @Prop({ required: true, ref: 'User' })
  createdBy: mongoose.Schema.Types.ObjectId;

  @ApiProperty({
    description: 'Indicates if the class is archived',
    example: false,
    default: false
  })
  @Prop({ default: false })
  archived: boolean;

  @ApiProperty({
    description: 'Unique code to join the class',
    example: 'XYZ123',
    uniqueItems: true
  })
  @Prop({ unique: true, default: () => Math.random().toString(36).substring(2, 8).toUpperCase() })
  code: string;

  @ApiPropertyOptional({
    description: 'Class-specific settings',
    example: { allowLateSubmissions: true, gradingScale: 'A-F' },
    default: {}
  })
  @Prop({ type: Object, default: {} })
  settings: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Class start date',
    example: '2023-09-01T00:00:00Z'
  })
  @Prop({ type: Date })
  startDate: Date;

  @ApiPropertyOptional({
    description: 'Class end date',
    example: '2023-12-31T23:59:59Z'
  })
  @Prop({ type: Date })
  endDate: Date;

  @ApiProperty({
    description: 'Class creation date',
    example: '2023-01-01T12:00:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Class last update date',
    example: '2023-01-01T12:00:00Z'
  })
  updatedAt: Date;
}

export const ClassSchema = SchemaFactory.createForClass(Class); 