import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SubmissionService } from './submission.service';
import { Submission, SubmissionStatus } from './submission.schema';
import { CreateSubmissionDto } from './submission.dto';
import { CorrectionService } from '../corrections/correction.service';
import { createSubmissionDto, submissionStub, SubmissionWithId } from '../../../test/factories/submission.factory';

describe('SubmissionService', () => {
  let service: SubmissionService;
  let model: any;
  let correctionService: { 
    removeBySubmission: jest.Mock
  };
  const mockRequest = { user: { sub: new Types.ObjectId().toString() } };

  beforeEach(async () => {
    // Reset all mocks for each test
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionService,
        {
          provide: getModelToken(Submission.name),
          useValue: {
            find: jest.fn().mockReturnThis(),
            findOne: jest.fn().mockReturnThis(),
            findById: jest.fn().mockReturnThis(),
            findByIdAndUpdate: jest.fn().mockReturnThis(),
            findByIdAndDelete: jest.fn().mockReturnThis(),
            deleteMany: jest.fn().mockReturnThis(),
            exec: jest.fn(),
          },
        },
        {
          provide: CorrectionService,
          useValue: {
            removeBySubmission: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: REQUEST,
          useValue: mockRequest,
        },
      ],
    }).compile();

    service = module.get<SubmissionService>(SubmissionService);
    model = module.get(getModelToken(Submission.name));
    correctionService = module.get(CorrectionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw BadRequestException if submission already exists', async () => {
      const dto = createSubmissionDto();
      const existingSubmission = submissionStub();
      
      // Simulate an existing submission
      model.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingSubmission),
      });
      
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      expect(model.findOne).toHaveBeenCalledWith({
        studentId: dto.studentId,
        taskId: dto.taskId,
      });
    });
  });

  // For now we will only handle read operations
  // to avoid issues related to mock constructor and save()
  describe('findAll', () => {
    it('should return all submissions', async () => {
      const submissions = [submissionStub(), submissionStub()];
      
      model.find = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(submissions),
      });
      
      const result = await service.findAll();
      
      expect(model.find).toHaveBeenCalledWith();
      expect(result).toEqual(submissions);
    });
  });

  describe('findOne', () => {
    it('should return a submission by id', async () => {
      const submission = submissionStub();
      const id = submission._id.toString();
      
      model.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(submission),
      });
      
      const result = await service.findOne(id);
      
      expect(model.findById).toHaveBeenCalledWith(id);
      expect(result).toEqual(submission);
    });

    it('should throw NotFoundException if submission not found', async () => {
      const id = new Types.ObjectId().toString();
      
      model.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      
      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByTask', () => {
    it('should return all submissions for a task', async () => {
      const taskId = new Types.ObjectId().toString();
      const submissions = [
        submissionStub({ taskId }),
        submissionStub({ taskId }),
      ];
      
      model.find = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(submissions),
      });
      
      const result = await service.findByTask(taskId);
      
      expect(model.find).toHaveBeenCalledWith({ taskId });
      expect(result).toEqual(submissions);
    });
  });

  describe('findByStudent', () => {
    it('should return all submissions for a student', async () => {
      const studentId = new Types.ObjectId().toString();
      const submissions = [
        submissionStub({ studentId }),
        submissionStub({ studentId }),
      ];
      
      model.find = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(submissions),
      });
      
      const result = await service.findByStudent(studentId);
      
      expect(model.find).toHaveBeenCalledWith({ studentId });
      expect(result).toEqual(submissions);
    });
  });

  describe('findByStudentAndTask', () => {
    it('should return a submission for a specific student and task', async () => {
      const studentId = new Types.ObjectId().toString();
      const taskId = new Types.ObjectId().toString();
      const submission = submissionStub({ studentId, taskId });
      
      model.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(submission),
      });
      
      const result = await service.findByStudentAndTask(studentId, taskId);
      
      expect(model.findOne).toHaveBeenCalledWith({ studentId, taskId });
      expect(result).toEqual(submission);
    });

    it('should throw NotFoundException if no submission is found', async () => {
      const studentId = new Types.ObjectId().toString();
      const taskId = new Types.ObjectId().toString();
      
      model.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      
      await expect(service.findByStudentAndTask(studentId, taskId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a submission', async () => {
      const submission = submissionStub();
      const id = submission._id.toString();
      const updateDto = { status: SubmissionStatus.SUBMITTED };
      const updatedSubmission = { ...submission, ...updateDto, submittedAt: expect.any(Date) };
      
      model.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(submission),
      });
      model.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedSubmission),
      });
      
      const result = await service.update(id, updateDto);
      
      expect(model.findById).toHaveBeenCalledWith(id);
      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        { ...updateDto, submittedAt: expect.any(Date) },
        { new: true },
      );
      expect(result).toEqual(updatedSubmission);
    });

    it('should throw NotFoundException if submission not found during update', async () => {
      const id = new Types.ObjectId().toString();
      const updateDto = { status: SubmissionStatus.SUBMITTED };
      
      model.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      
      await expect(service.update(id, updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a submission and its corrections', async () => {
      const submission = submissionStub();
      const id = submission._id.toString();
      
      model.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(submission),
      });
      model.findByIdAndDelete = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(submission),
      });
      
      const result = await service.remove(id);
      
      expect(model.findById).toHaveBeenCalledWith(id);
      expect(correctionService.removeBySubmission).toHaveBeenCalledWith(id);
      expect(model.findByIdAndDelete).toHaveBeenCalledWith(id);
      expect(result).toEqual(submission);
    });
  });

  describe('removeByTask', () => {
    it('should delete all submissions for a task and their corrections', async () => {
      const taskId = new Types.ObjectId().toString();
      const submissions = [
        submissionStub({ taskId }),
        submissionStub({ taskId }),
      ];
      
      // Mock the submissions to be deleted
      model.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(submissions),
      });
      
      model.deleteMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: submissions.length }),
      });
      
      await service.removeByTask(taskId);
      
      // Verify that findByTask was called with the right ID
      expect(model.find).toHaveBeenCalledWith({ taskId });
      
      // Verify that removeBySubmission was called for each submission
      submissions.forEach(sub => {
        expect(correctionService.removeBySubmission).toHaveBeenCalledWith(sub._id.toString());
      });
      
      // Verify that deleteMany was called with the right filter
      expect(model.deleteMany).toHaveBeenCalledWith({ taskId });
    });
    
    it('should not throw if correction removal fails but continue with submission removal', async () => {
      const taskId = new Types.ObjectId().toString();
      const submissions = [submissionStub({ taskId })];
      
      // Simulate an error in NotFoundException when calling removeBySubmission
      correctionService.removeBySubmission.mockRejectedValueOnce(new NotFoundException());
      
      model.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(submissions),
      });
      
      model.deleteMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: submissions.length }),
      });
      
      // This operation should not throw an error
      await service.removeByTask(taskId);
      
      // Verify that despite the error, the process continued and deleteMany was called
      expect(model.deleteMany).toHaveBeenCalledWith({ taskId });
    });
    
    it('should propagate unexpected errors', async () => {
      const taskId = new Types.ObjectId().toString();
      
      // Simulate a serious error that should be propagated
      model.find.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Serious database error')),
      });
      
      // This operation should propagate the error
      await expect(service.removeByTask(taskId)).rejects.toThrow('Serious database error');
      
      // deleteMany should not be called because the error is propagated
      expect(model.deleteMany).not.toHaveBeenCalled();
    });
  });
}); 