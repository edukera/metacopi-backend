import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

@Schema({
  timestamps: true,
  versionKey: false,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password; // Never return the password
      return ret;
    },
  },
})
export class User {
  @ApiProperty({
    description: 'Unique user email',
    example: 'user@example.com',
    required: true
  })
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email: string;

  @ApiProperty({
    description: 'User\'s hashed password',
    example: '$2b$10$X7ICrz79FAXD8bwCfZZd.uIKiYn7XvAnqTknpTBQhF2UWpYDX8rMK',
    required: true,
    writeOnly: true
  })
  @Prop({ required: true })
  password: string;

  @ApiProperty({
    description: 'User\'s first name',
    example: 'John',
    required: true
  })
  @Prop({ required: true, trim: true })
  firstName: string;

  @ApiProperty({
    description: 'User\'s last name',
    example: 'Doe',
    required: true
  })
  @Prop({ required: true, trim: true })
  lastName: string;

  @ApiProperty({
    description: 'URL of the user\'s avatar',
    example: 'https://example.com/avatars/user.jpg',
    required: false
  })
  @Prop()
  avatarUrl?: string;

  @ApiProperty({
    description: 'Indicates if the user\'s email has been verified',
    example: false,
    default: false
  })
  @Prop({ default: false })
  emailVerified: boolean;

  @ApiProperty({
    description: 'User\'s role',
    example: UserRole.USER,
    enum: UserRole,
    default: UserRole.USER
  })
  @Prop({ 
    type: String, 
    enum: Object.values(UserRole),
    default: UserRole.USER 
  })
  role: UserRole;

  // Automatically added thanks to { timestamps: true }
  @ApiProperty({
    description: 'User creation date',
    example: '2023-01-01T12:00:00Z'
  })
  createdAt: Date;
  
  @ApiProperty({
    description: 'User last update date',
    example: '2023-01-01T12:00:00Z'
  })
  updatedAt: Date;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User); 