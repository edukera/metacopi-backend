import { faker } from '@faker-js/faker';
import { Types } from 'mongoose';
import { User, UserRole } from '../../src/modules/users/user.schema';
import { CreateUserDto, UpdateUserDto } from '../../src/modules/users/user.interface';

export interface UserWithId extends User {
  id: string;
}

export const createUserDto = (
  overrides: Partial<CreateUserDto> = {},
): CreateUserDto => {
  return {
    email: faker.internet.email().toLowerCase(),
    password: faker.internet.password(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    ...(overrides.avatarUrl && { avatarUrl: overrides.avatarUrl }),
    ...(overrides.role && { role: overrides.role }),
    ...overrides,
  };
};

export const updateUserDto = (
  overrides: Partial<UpdateUserDto> = {},
): UpdateUserDto => {
  return {
    ...(overrides.firstName && { firstName: overrides.firstName }),
    ...(overrides.lastName && { lastName: overrides.lastName }),
    ...(overrides.password && { password: overrides.password }),
    ...(overrides.avatarUrl && { avatarUrl: overrides.avatarUrl }),
    ...(overrides.emailVerified !== undefined && { emailVerified: overrides.emailVerified }),
    ...(overrides.role && { role: overrides.role }),
    ...overrides,
  };
};

export const userStub = (
  overrides: Partial<UserWithId> = {},
): UserWithId => {
  const now = new Date();
  
  return {
    id: overrides.id || new Types.ObjectId().toString(),
    email: overrides.email || faker.internet.email().toLowerCase(),
    password: overrides.password || faker.internet.password(),
    firstName: overrides.firstName || faker.person.firstName(),
    lastName: overrides.lastName || faker.person.lastName(),
    avatarUrl: overrides.avatarUrl,
    emailVerified: overrides.emailVerified !== undefined ? overrides.emailVerified : false,
    role: overrides.role || UserRole.USER,
    createdAt: overrides.createdAt || now,
    updatedAt: overrides.updatedAt || now,
  };
}; 