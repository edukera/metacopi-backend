import { faker } from '@faker-js/faker';
import { Types, Document } from 'mongoose';
import { Submission, SubmissionStatus } from '../../src/modules/submissions/submission.schema';
import { CreateSubmissionDto } from '../../src/modules/submissions/submission.dto';

export interface SubmissionWithId extends Submission {
  _id: Types.ObjectId;
}

export interface SubmissionStub extends Omit<Submission, keyof Document> {
  _id: Types.ObjectId;
  taskId: string;
  studentId: string;
  uploadedBy: string;
  status: SubmissionStatus;
  rawPages: string[];
  processedPages: string[];
  submittedAt: Date | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  save: jest.Mock;
  toObject: jest.Mock;
  toJSON: jest.Mock;
}

export const createSubmissionDto = (
  overrides: Partial<CreateSubmissionDto> = {},
): CreateSubmissionDto => {
  return {
    id: overrides.id || new Types.ObjectId().toString(),
    taskId: new Types.ObjectId().toString(),
    studentEmail: new Types.ObjectId().toString(),
    pages: [],
    status: SubmissionStatus.DRAFT,
    ...overrides,
  };
};

export const submissionStub = (
  overrides: Partial<SubmissionStub> = {},
): SubmissionStub => {
  const now = new Date();
  const stub: SubmissionStub = {
    _id: overrides._id || new Types.ObjectId(),
    taskId: overrides.taskId || new Types.ObjectId().toString(),
    studentId: overrides.studentId || new Types.ObjectId().toString(),
    uploadedBy: overrides.uploadedBy || new Types.ObjectId().toString(),
    status: overrides.status || SubmissionStatus.DRAFT,
    rawPages: overrides.rawPages || [faker.system.filePath(), faker.system.filePath()],
    processedPages: overrides.processedPages || [],
    submittedAt: overrides.submittedAt || null,
    reviewedAt: overrides.reviewedAt || null,
    createdAt: overrides.createdAt || now,
    updatedAt: overrides.updatedAt || now,
    studentEmail: overrides.studentEmail || faker.internet.email(),
    pages: overrides.pages || [],
    uploadedByEmail: overrides.uploadedByEmail || faker.internet.email(),
    save: jest.fn().mockImplementation(() => Promise.resolve(stub)),
    toObject: jest.fn().mockImplementation(() => stub),
    toJSON: jest.fn().mockImplementation(() => stub),
  };

  return { ...stub, ...overrides };
}; 