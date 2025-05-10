import { faker } from '@faker-js/faker';
import { Types, Document } from 'mongoose';
import { AuditLog } from '../../src/modules/audit-logs/audit-log.schema';
import { CreateAuditLogDto } from '../../src/modules/audit-logs/audit-log.dto';
import { TargetType } from '../../src/modules/audit-logs/audit-log.schema';

export interface AuditLogStub extends Omit<AuditLog, keyof Document> {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  save: jest.Mock;
  toObject: jest.Mock;
  toJSON: jest.Mock;
}

export const createAuditLogDto = (
  overrides: Partial<CreateAuditLogDto> = {},
): CreateAuditLogDto => {
  return {
    userId: overrides.userId || new Types.ObjectId().toString(),
    action: overrides.action || faker.word.verb(),
    targetType: overrides.targetType || TargetType.USER,
    targetId: overrides.targetId || new Types.ObjectId().toString(),
    metadata: overrides.metadata || {},
    ...overrides,
  };
};

export const auditLogStub = (
  overrides: Partial<AuditLogStub> = {},
): AuditLogStub => {
  const _id = overrides._id || new Types.ObjectId();
  const now = new Date();
  
  return {
    _id,
    email: overrides.email || new Types.ObjectId().toString(),
    action: overrides.action || faker.word.verb(),
    targetType: overrides.targetType || TargetType.USER,
    targetId: overrides.targetId || new Types.ObjectId().toString(),
    metadata: overrides.metadata || {},
    timestamp: overrides.timestamp || now,
    createdAt: overrides.createdAt || now,
    updatedAt: overrides.updatedAt || now,
    save: jest.fn().mockResolvedValue({}),
    toObject: jest.fn().mockReturnValue({}),
    toJSON: jest.fn().mockReturnValue({}),
    ...overrides,
  };
}; 