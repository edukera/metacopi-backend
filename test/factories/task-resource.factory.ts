import { faker } from '@faker-js/faker';
import { Types } from 'mongoose';
import { CreateTaskResourceDto } from '../../src/modules/task-resources/task-resource.dto';
import { ResourceType } from '../../src/modules/task-resources/task-resource.schema';
import { TaskResource } from '../../src/modules/task-resources/task-resource.schema';

export interface TaskResourceStub extends Omit<TaskResource, 'save'> {
  save: () => Promise<this>;
  toObject: () => any;
  toJSON: () => any;
}

export const createTaskResourceDto = (
  type: ResourceType = ResourceType.TEXT,
  overrides: Partial<CreateTaskResourceDto> = {},
): CreateTaskResourceDto => {
  const base = {
    name: faker.lorem.words(3),
    description: faker.lorem.sentence(),
    taskId: new Types.ObjectId().toString(),
    type,
    isRequired: faker.datatype.boolean(),
    order: faker.number.int({ min: 0, max: 100 }),
    metadata: {},
  };

  switch (type) {
    case ResourceType.FILE:
      return {
        ...base,
        filePath: faker.system.filePath(),
        mimeType: faker.system.mimeType(),
        fileSize: faker.number.int({ min: 1000, max: 10000000 }),
        ...overrides,
      };
    case ResourceType.LINK:
      return {
        ...base,
        url: faker.internet.url(),
        ...overrides,
      };
    case ResourceType.TEXT:
      return {
        ...base,
        content: faker.lorem.paragraphs(),
        ...overrides,
      };
    case ResourceType.CODE:
      return {
        ...base,
        content: faker.lorem.lines({ min: 5, max: 20 }),
        metadata: {
          language: faker.helpers.arrayElement(['typescript', 'javascript', 'python', 'java']),
          lineCount: faker.number.int({ min: 5, max: 100 }),
        },
        ...overrides,
      };
    default:
      return { ...base, ...overrides };
  }
};

export const updateTaskResourceDto = (
  overrides: Partial<CreateTaskResourceDto> = {},
): Partial<CreateTaskResourceDto> => {
  return {
    name: faker.lorem.words(3),
    description: faker.lorem.sentence(),
    isRequired: faker.datatype.boolean(),
    order: faker.number.int({ min: 0, max: 100 }),
    ...overrides,
  };
};

export const taskResourceStub = (
  overrides: Partial<TaskResourceStub> = {},
): TaskResourceStub => {
  const base = {
    _id: new Types.ObjectId(),
    name: faker.lorem.words(3),
    description: faker.lorem.sentence(),
    taskId: new Types.ObjectId(),
    type: faker.helpers.arrayElement(Object.values(ResourceType)),
    isRequired: faker.datatype.boolean(),
    order: faker.number.int({ min: 0, max: 100 }),
    metadata: {},
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    save: () => Promise.resolve({ ...base, ...overrides } as TaskResourceStub),
    toObject: () => ({ ...base, ...overrides } as TaskResourceStub),
    toJSON: () => ({ ...base, ...overrides } as TaskResourceStub),
  };

  switch (base.type) {
    case ResourceType.FILE:
      base.metadata = {
        filename: faker.system.fileName(),
        mimetype: faker.system.mimeType(),
        size: faker.number.int({ min: 1000, max: 10000000 }),
      };
      break;
    case ResourceType.LINK:
      base.metadata = {
        url: faker.internet.url(),
      };
      break;
    case ResourceType.TEXT:
      base.metadata = {
        content: faker.lorem.paragraphs(),
      };
      break;
    case ResourceType.CODE:
      base.metadata = {
        content: faker.lorem.lines(),
        language: faker.helpers.arrayElement(['typescript', 'javascript', 'python', 'java']),
      };
      break;
  }

  return { ...base, ...overrides } as TaskResourceStub;
}; 