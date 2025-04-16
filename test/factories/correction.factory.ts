import { faker } from '@faker-js/faker';
import { Types, Document } from 'mongoose';
import { Correction, CorrectionStatus } from '../../src/modules/corrections/correction.schema';
import { CreateCorrectionDto, UpdateCorrectionDto } from '../../src/modules/corrections/correction.dto';

export interface CorrectionStub extends Omit<Correction, keyof Document> {
  _id: Types.ObjectId;
  submissionId: string;
  correctedById: string;
  taskId?: string;
  status: CorrectionStatus;
  annotations: string;
  grade: number;
  appreciation: string;
  finalizedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  save: jest.Mock;
  toObject: jest.Mock;
  toJSON: jest.Mock;
  populate: jest.Mock;
}

export interface CreateCorrectionData {
  submissionId: string;
  correctedById: string;
  status?: CorrectionStatus;
  annotations?: string;
  grade?: number;
  appreciation?: string;
  finalizedAt?: Date;
}

export const createCorrectionData = (
  overrides: Partial<CreateCorrectionData> = {},
): CreateCorrectionData => {
  return {
    submissionId: overrides.submissionId || new Types.ObjectId().toString(),
    correctedById: overrides.correctedById || new Types.ObjectId().toString(),
    ...(overrides.status !== undefined && { status: overrides.status }),
    ...(overrides.annotations !== undefined && { annotations: overrides.annotations }),
    ...(overrides.grade !== undefined && { grade: overrides.grade }),
    ...(overrides.appreciation !== undefined && { appreciation: overrides.appreciation }),
    ...(overrides.finalizedAt !== undefined && { finalizedAt: overrides.finalizedAt }),
    ...overrides,
  };
};

export const createCorrectionDto = (
  override: Partial<CreateCorrectionDto> = {},
): CreateCorrectionDto => {
  return {
    submissionId: new Types.ObjectId().toString(),
    correctedById: new Types.ObjectId().toString(),
    annotations: faker.lorem.paragraph(),
    grade: faker.number.int({ min: 0, max: 20 }),
    appreciation: faker.lorem.sentence(),
    status: CorrectionStatus.IN_PROGRESS,
    ...override,
  };
};

export const updateCorrectionDto = (
  override: Partial<UpdateCorrectionDto> = {},
): UpdateCorrectionDto => {
  return {
    annotations: faker.lorem.paragraph(),
    grade: faker.number.int({ min: 0, max: 20 }),
    appreciation: faker.lorem.sentence(),
    status: CorrectionStatus.COMPLETED,
    finalizedAt: faker.date.future(),
    ...override,
  };
};

export const correctionStub = (
  override: Partial<CorrectionStub> = {},
): CorrectionStub => {
  const now = new Date();
  const stub: CorrectionStub = {
    _id: override._id || new Types.ObjectId(),
    submissionId: override.submissionId || new Types.ObjectId().toString(),
    correctedById: override.correctedById || new Types.ObjectId().toString(),
    status: override.status || CorrectionStatus.IN_PROGRESS,
    annotations: override.annotations || faker.lorem.paragraph(),
    grade: override.grade !== undefined ? override.grade : faker.number.int({ min: 0, max: 20 }),
    appreciation: override.appreciation || faker.lorem.sentence(),
    finalizedAt: override.finalizedAt || null,
    createdAt: override.createdAt || now,
    updatedAt: override.updatedAt || now,
    save: jest.fn().mockImplementation(() => Promise.resolve(stub)),
    toObject: jest.fn().mockImplementation(() => stub),
    toJSON: jest.fn().mockImplementation(() => stub),
    populate: jest.fn().mockImplementation(() => Promise.resolve(stub)),
  };

  return { ...stub, ...override };
}; 