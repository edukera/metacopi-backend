import { MockType } from './mock.type';

export const mockProvider = <T>(token: any): any => ({
  provide: token,
  useFactory: (): MockType<T> => ({
    findOne: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    exec: jest.fn(),
    populate: jest.fn(),
    removeBySubmission: jest.fn(),
    prototype: {
      save: jest.fn(),
    },
  }),
}); 