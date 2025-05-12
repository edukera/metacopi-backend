import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsBoolean, IsEnum, MinLength, IsUrl } from 'class-validator';
import { UserRole } from '../user.schema';

export class CreateUserDto {
  @ApiProperty({
    description: 'User\'s unique email (main identifier)',
    example: 'user@example.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User\'s password',
    example: 'password123',
    minLength: 8
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'User\'s first name',
    example: 'John'
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'User\'s last name',
    example: 'Doe'
  })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({
    description: 'URL of the user\'s avatar',
    example: 'https://example.com/avatars/user.jpg'
  })
  @IsUrl()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'User\'s role',
    enum: UserRole,
    default: UserRole.USER
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email'] as const),
) {
  @ApiPropertyOptional({
    description: 'Indicates whether the user\'s email has been verified',
    example: true
  })
  @IsBoolean()
  @IsOptional()
  emailVerified?: boolean;
}

export class UserResponseDto {
  @ApiProperty({
    description: 'User\'s unique identifier',
    example: 'user@example.com'
  })
  email: string;

  @ApiProperty({
    description: 'User\'s first name',
    example: 'John'
  })
  firstName: string;

  @ApiProperty({
    description: 'User\'s last name',
    example: 'Doe'
  })
  lastName: string;

  @ApiPropertyOptional({
    description: 'URL of the user\'s avatar',
    example: 'https://example.com/avatars/user.jpg'
  })
  avatarUrl?: string;

  @ApiProperty({
    description: 'Indicates whether the user\'s email has been verified',
    example: false
  })
  emailVerified: boolean;

  @ApiProperty({
    description: 'User\'s role',
    enum: UserRole,
    example: UserRole.USER
  })
  role: UserRole;

  @ApiProperty({
    description: 'User\'s creation date',
    example: '2023-01-01T12:00:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'User\'s last update date',
    example: '2023-01-01T12:00:00Z'
  })
  updatedAt: Date;
} 