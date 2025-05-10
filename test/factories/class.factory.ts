import { faker } from '@faker-js/faker';
import { Types, Document } from 'mongoose';
import { Class } from '../../src/modules/classes/class.schema';
import { CreateClassDto, UpdateClassDto } from '../../src/modules/classes/class.dto';

// Stub interface without direct inheritance from Mongoose class
export interface ClassStub {
  _id: Types.ObjectId;
  name: string;
  description: string;
  createdBy: string | Types.ObjectId;
  archived: boolean;
  code: string;
  settings: Record<string, any>;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  save: jest.Mock;
  toObject: jest.Mock;
  toJSON: jest.Mock;
}

export const createClassDto = (
  overrides: Partial<CreateClassDto> = {},
): CreateClassDto => {
  return {
    id: overrides.id || new Types.ObjectId().toString(),
    name: overrides.name || faker.company.name(),
    ...(overrides.description !== undefined && { description: overrides.description }),
    ...(overrides.startDate !== undefined && { startDate: overrides.startDate }),
    ...(overrides.endDate !== undefined && { endDate: overrides.endDate }),
    ...(overrides.settings !== undefined && { settings: overrides.settings }),
    ...(overrides.createdByEmail !== undefined && { createdByEmail: overrides.createdByEmail }),
  };
};

export const updateClassDto = (
  overrides: Partial<UpdateClassDto> = {},
): UpdateClassDto => {
  return {
    ...(overrides.name !== undefined && { name: overrides.name }),
    ...(overrides.description !== undefined && { description: overrides.description }),
    ...(overrides.startDate !== undefined && { startDate: overrides.startDate }),
    ...(overrides.endDate !== undefined && { endDate: overrides.endDate }),
    ...(overrides.archived !== undefined && { archived: overrides.archived }),
    ...(overrides.settings !== undefined && { settings: overrides.settings }),
    ...overrides,
  };
};

export const classStub = (
  overrides: Partial<ClassStub> = {},
): ClassStub => {
  const _id = overrides._id || new Types.ObjectId();
  const now = new Date();
  const oneMonthLater = new Date();
  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
  
  return {
    _id,
    name: overrides.name || faker.company.name(),
    description: overrides.description || faker.lorem.paragraph(),
    createdBy: overrides.createdBy || new Types.ObjectId(),
    archived: overrides.archived !== undefined ? overrides.archived : false,
    code: overrides.code || Math.random().toString(36).substring(2, 8).toUpperCase(),
    settings: overrides.settings || {},
    startDate: overrides.startDate || now,
    endDate: overrides.endDate || oneMonthLater,
    createdAt: overrides.createdAt || now,
    updatedAt: overrides.updatedAt || now,
    save: jest.fn().mockResolvedValue({}),
    toObject: jest.fn().mockReturnValue({}),
    toJSON: jest.fn().mockReturnValue({}),
    ...overrides,
  };
}; 