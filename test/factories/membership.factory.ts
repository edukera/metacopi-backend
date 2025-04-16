import { faker } from '@faker-js/faker';
import { Types, Document } from 'mongoose';
import { Membership, MembershipRole, MembershipStatus } from '../../src/modules/memberships/membership.schema';
import { CreateMembershipDto, UpdateMembershipDto } from '../../src/modules/memberships/membership.dto';

export interface MembershipStub extends Omit<Membership, keyof Document> {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  save: jest.Mock;
  toObject: jest.Mock;
  toJSON: jest.Mock;
}

export const createMembershipDto = (
  overrides: Partial<CreateMembershipDto> = {},
): CreateMembershipDto => {
  return {
    userId: overrides.userId || new Types.ObjectId().toString(),
    classId: overrides.classId || new Types.ObjectId().toString(),
    role: overrides.role || MembershipRole.STUDENT,
    status: overrides.status || MembershipStatus.ACTIVE,
    ...overrides,
  };
};

export const updateMembershipDto = (
  overrides: Partial<UpdateMembershipDto> = {},
): UpdateMembershipDto => {
  return {
    ...(overrides.role !== undefined && { role: overrides.role }),
    ...(overrides.status !== undefined && { status: overrides.status }),
    ...overrides,
  };
};

export const membershipStub = (
  overrides: Partial<MembershipStub> = {},
): MembershipStub => {
  const _id = overrides._id || new Types.ObjectId();
  const now = new Date();
  
  return {
    _id,
    userId: overrides.userId || new Types.ObjectId().toString(),
    classId: overrides.classId || new Types.ObjectId().toString(),
    role: overrides.role || MembershipRole.STUDENT,
    status: overrides.status || MembershipStatus.ACTIVE,
    isActive: overrides.isActive !== undefined ? overrides.isActive : true,
    joinedAt: overrides.joinedAt || now,
    createdAt: overrides.createdAt || now,
    updatedAt: overrides.updatedAt || now,
    save: jest.fn().mockResolvedValue({}),
    toObject: jest.fn().mockReturnValue({}),
    toJSON: jest.fn().mockReturnValue({}),
    ...overrides,
  };
}; 