import { IsDate, IsEnum, IsMongoId, IsObject, IsOptional, IsString } from 'class-validator';
import { MembershipStatus, MembershipRole } from './membership.schema';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMembershipDto {
  @ApiProperty({ description: 'User ID', example: '60d21b4667d0d8992e610c85' })
  @IsMongoId()
  userId: string;

  @ApiProperty({ description: 'Class ID', example: '60d21b4667d0d8992e610c86' })
  @IsMongoId()
  classId: string;

  @ApiPropertyOptional({
    description: 'Member role in the class',
    enum: MembershipRole,
    example: MembershipRole.STUDENT,
    default: MembershipRole.STUDENT
  })
  @IsOptional()
  @IsEnum(MembershipRole)
  role?: MembershipRole;

  @ApiPropertyOptional({
    description: 'Start date of the membership',
    example: '2023-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'End date of the membership',
    example: '2023-12-31T00:00:00.000Z'
  })
  @IsOptional()
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({
    description: 'Status of the membership',
    enum: MembershipStatus,
    example: MembershipStatus.ACTIVE,
    default: MembershipStatus.ACTIVE
  })
  @IsOptional()
  @IsEnum(MembershipStatus)
  status?: MembershipStatus;

  @ApiPropertyOptional({
    description: 'Payment ID associated with this membership',
    example: 'payment_123456'
  })
  @IsOptional()
  @IsString()
  paymentId?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the membership',
    example: { enrollmentReason: 'Mandatory course' }
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateMembershipDto {
  @ApiPropertyOptional({
    description: 'Member role in the class',
    enum: MembershipRole,
    example: MembershipRole.STUDENT
  })
  @IsOptional()
  @IsEnum(MembershipRole)
  role?: MembershipRole;

  @ApiPropertyOptional({
    description: 'Start date of the membership',
    example: '2023-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'End date of the membership',
    example: '2023-12-31T00:00:00.000Z'
  })
  @IsOptional()
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({
    description: 'Status of the membership',
    enum: MembershipStatus,
    example: MembershipStatus.ACTIVE
  })
  @IsOptional()
  @IsEnum(MembershipStatus)
  status?: MembershipStatus;

  @ApiPropertyOptional({
    description: 'Payment ID associated with this membership',
    example: 'payment_123456'
  })
  @IsOptional()
  @IsString()
  paymentId?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the membership',
    example: { enrollmentReason: 'Mandatory course' }
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}