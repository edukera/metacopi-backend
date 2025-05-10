import { faker } from '@faker-js/faker';
import { Types } from 'mongoose';
import { TaskStatus, Task } from '../../src/modules/tasks/task.schema';
import { CreateTaskDto, UpdateTaskDto } from '../../src/modules/tasks/task.dto';
import { Document } from 'mongoose';

export interface TaskStub extends Omit<Task, keyof Document> {
  _id: string;
  title: string;
  description: string;
  classId: string;
  createdBy: string;
  status: TaskStatus;
  dueDate: Date;
  points: number;
  tags: string[];
  metadata: Record<string, any>;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  save: jest.Mock;
  toObject: jest.Mock;
  toJSON: jest.Mock;
  populate: jest.Mock;
}

export const createTaskDto = (override: Partial<CreateTaskDto> = {}): CreateTaskDto => {
  return {
    id: faker.string.uuid(),
    title: faker.lorem.sentence(3),
    description: faker.lorem.paragraph(),
    classId: new Types.ObjectId().toString(),
    status: TaskStatus.DRAFT,
    dueDate: faker.date.future(),
    points: faker.number.int({ min: 0, max: 100 }),
    tags: [faker.lorem.word(), faker.lorem.word()],
    metadata: {},
    settings: {},
    createdByEmail: faker.internet.email(),
    ...override,
  };
};

export const updateTaskDto = (override: Partial<UpdateTaskDto> = {}): UpdateTaskDto => {
  return {
    title: faker.lorem.sentence(3),
    description: faker.lorem.paragraph(),
    status: TaskStatus.PUBLISHED,
    dueDate: faker.date.future(),
    points: faker.number.int({ min: 0, max: 100 }),
    tags: [faker.lorem.word(), faker.lorem.word()],
    metadata: { updated: true },
    settings: { updated: true },
    ...override,
  };
};

export const taskStub = (override: Partial<TaskStub> = {}): TaskStub => {
  const now = new Date();
  const stub: TaskStub = {
    _id: new Types.ObjectId().toString(),
    title: faker.lorem.sentence(3),
    description: faker.lorem.paragraph(),
    classId: new Types.ObjectId().toString(),
    createdBy: new Types.ObjectId().toString(),
    status: TaskStatus.DRAFT,
    dueDate: faker.date.future(),
    points: faker.number.int({ min: 0, max: 100 }),
    tags: [faker.lorem.word(), faker.lorem.word()],
    metadata: {},
    settings: {},
    createdAt: now,
    updatedAt: now,
    createdByEmail: faker.internet.email(),
    save: jest.fn().mockImplementation(() => Promise.resolve(stub)),
    toObject: jest.fn().mockImplementation(() => stub),
    toJSON: jest.fn().mockImplementation(() => stub),
    populate: jest.fn().mockImplementation(() => Promise.resolve(stub)),
  };

  return { ...stub, ...override };
}; 