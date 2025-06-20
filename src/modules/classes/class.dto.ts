import { IsString, IsOptional, IsDate, IsBoolean, IsObject, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClassDto {
  @ApiProperty({
    description: "Logical business identifier for the class (must be unique)",
    example: "CLS-2024-001",
    required: true
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Class name',
    example: 'Mathematics 101',
    required: true
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Class description',
    example: 'Introduction to mathematics'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Class start date',
    example: '2023-09-01T00:00:00Z'
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'Class end date',
    example: '2023-12-31T23:59:59Z'
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({
    description: 'Class specific settings',
    example: { allowLateSubmissions: true, gradingScale: 'A-F' }
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;

  @ApiProperty({
    description: "Email of the user who created the class",
    example: "user@example.com",
    required: true
  })
  @IsString()
  createdByEmail: string;
}

export class UpdateClassDto {
  @ApiPropertyOptional({
    description: 'Class name',
    example: 'Advanced Mathematics'
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Class description',
    example: 'Advanced mathematics course'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Class start date',
    example: '2023-09-01T00:00:00Z'
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'Class end date',
    example: '2023-12-31T23:59:59Z'
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({
    description: 'Indicates if the class is archived',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  archived?: boolean;

  @ApiPropertyOptional({
    description: 'Class specific settings',
    example: { allowLateSubmissions: false, gradingScale: 'Percentage' }
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}

export class JoinClassDto {
  @ApiProperty({
    description: 'Unique code to join the class',
    example: 'XYZ123',
    required: true
  })
  @IsString()
  code: string;
}

export class ClassResponseDto {
  @ApiProperty({
    description: "Logical business identifier for the class (unique)",
    example: "CLS-2024-001"
  })
  id: string;

  @ApiProperty({
    description: 'Class name',
    example: 'Mathematics 101'
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Class description',
    example: 'Introduction to mathematics'
  })
  description?: string;

  @ApiProperty({
    description: "Email of the user who created the class",
    example: "user@example.com"
  })
  createdByEmail: string;

  @ApiProperty({
    description: 'Indicates if the class is archived',
    example: false
  })
  archived: boolean;

  @ApiProperty({
    description: 'Unique code to join the class',
    example: 'XYZ123'
  })
  code: string;

  @ApiProperty({
    description: 'Class specific settings',
    example: { allowLateSubmissions: true, gradingScale: 'A-F' }
  })
  settings: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Class start date',
    example: '2023-09-01T00:00:00Z'
  })
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'Class end date',
    example: '2023-12-31T23:59:59Z'
  })
  endDate?: Date;

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

export class ClassUserResponseDto {
  @ApiProperty({
    description: "User email",
    example: "user@example.com"
  })
  email: string;

  @ApiProperty({
    description: "User first name",
    example: "John"
  })
  firstName: string;

  @ApiProperty({
    description: "User last name",
    example: "Doe"
  })
  lastName: string;

  @ApiPropertyOptional({
    description: "User avatar URL",
    example: "https://example.com/avatar.jpg"
  })
  avatarUrl?: string;

  @ApiProperty({
    description: "User role in the class",
    example: "teacher",
    enum: ['teacher', 'student']
  })
  role: string;

  @ApiProperty({
    description: "Membership creation date",
    example: "2023-01-01T12:00:00Z"
  })
  joinedAt: Date;
} 