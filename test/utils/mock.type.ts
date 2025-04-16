export type MockType<T> = {
  findOne?: jest.Mock<unknown>;
  find?: jest.Mock<unknown>;
  findById?: jest.Mock<unknown>;
  create?: jest.Mock<unknown>;
  save?: jest.Mock<unknown>;
  updateOne?: jest.Mock<unknown>;
  deleteOne?: jest.Mock<unknown>;
  findByIdAndUpdate?: jest.Mock<unknown>;
  findByIdAndDelete?: jest.Mock<unknown>;
  exec?: jest.Mock<unknown>;
  populate?: jest.Mock<unknown>;
  removeBySubmission?: jest.Mock<unknown>;
  prototype?: {
    save: jest.Mock<unknown>;
  };
}; 