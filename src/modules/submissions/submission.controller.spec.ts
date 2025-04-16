import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionController } from './submission.controller';
import { SubmissionService } from './submission.service';
import { CreateSubmissionDto, UpdateSubmissionDto } from './submission.dto';
import { NotFoundException } from '@nestjs/common';
import { Submission, SubmissionStatus, SubmissionDocument } from './submission.schema';
import mongoose, { Document } from 'mongoose';

describe('SubmissionController', () => {
  let controller: SubmissionController;
  let service: SubmissionService;

  const mockSubmissionId = new mongoose.Types.ObjectId().toString();
  const mockStudentId = new mongoose.Types.ObjectId().toString();
  const mockTaskId = new mongoose.Types.ObjectId().toString();
  const mockUploaderId = new mongoose.Types.ObjectId().toString();

  const mockSubmission = {
    _id: mockSubmissionId,
    studentId: mockStudentId,
    taskId: mockTaskId,
    uploadedBy: mockUploaderId,
    status: SubmissionStatus.SUBMITTED,
    rawPages: ['page1.jpg', 'page2.jpg'],
    processedPages: ['processed1.jpg', 'processed2.jpg'],
    submittedAt: new Date(),
    reviewedAt: null,
  } as unknown as SubmissionDocument;

  const mockSubmissions = [
    mockSubmission,
    {
      _id: new mongoose.Types.ObjectId().toString(),
      studentId: new mongoose.Types.ObjectId().toString(),
      taskId: mockTaskId,
      uploadedBy: mockUploaderId,
      status: SubmissionStatus.DRAFT,
      rawPages: ['page1.jpg'],
      processedPages: [],
      submittedAt: null,
      reviewedAt: null,
    } as unknown as SubmissionDocument
  ];

  // Mock SubmissionService
  const mockSubmissionService = {
    create: jest.fn().mockImplementation((dto: CreateSubmissionDto) => {
      const newSubmission = {
        _id: new mongoose.Types.ObjectId().toString(),
        ...dto,
        status: SubmissionStatus.DRAFT,
        rawPages: dto.rawPages || [],
        processedPages: [],
        submittedAt: null,
        reviewedAt: null,
      } as unknown as SubmissionDocument;
      return Promise.resolve(newSubmission);
    }),
    findAll: jest.fn().mockResolvedValue(mockSubmissions),
    findOne: jest.fn().mockImplementation((id: string) => {
      const submission = mockSubmissions.find(s => s._id.toString() === id);
      if (!submission) {
        throw new NotFoundException(`Submission with ID ${id} not found`);
      }
      return Promise.resolve(submission);
    }),
    findByTask: jest.fn().mockImplementation((taskId: string) => {
      const submissions = mockSubmissions.filter(s => s.taskId === taskId);
      return Promise.resolve(submissions);
    }),
    findByStudent: jest.fn().mockImplementation((studentId: string) => {
      const submissions = mockSubmissions.filter(s => s.studentId === studentId);
      return Promise.resolve(submissions);
    }),
    findByStudentAndTask: jest.fn().mockImplementation((studentId: string, taskId: string) => {
      const submission = mockSubmissions.find(s => s.studentId === studentId && s.taskId === taskId);
      if (!submission) {
        throw new NotFoundException('Submission not found');
      }
      return Promise.resolve(submission);
    }),
    update: jest.fn().mockImplementation((id: string, dto: UpdateSubmissionDto) => {
      const submissionIndex = mockSubmissions.findIndex(s => s._id.toString() === id);
      if (submissionIndex === -1) {
        throw new NotFoundException(`Submission with ID ${id} not found`);
      }
      const updatedSubmission = { ...mockSubmissions[submissionIndex], ...dto };
      return Promise.resolve(updatedSubmission as unknown as SubmissionDocument);
    }),
    remove: jest.fn().mockImplementation((id: string) => {
      const submissionIndex = mockSubmissions.findIndex(s => s._id.toString() === id);
      if (submissionIndex === -1) {
        throw new NotFoundException(`Submission with ID ${id} not found`);
      }
      return Promise.resolve();
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubmissionController],
      providers: [
        {
          provide: SubmissionService,
          useValue: mockSubmissionService,
        },
      ],
    }).compile();

    controller = module.get<SubmissionController>(SubmissionController);
    service = module.get<SubmissionService>(SubmissionService);

    // Reset mock counters
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new submission', async () => {
      const createSubmissionDto: CreateSubmissionDto = {
        studentId: mockStudentId,
        taskId: mockTaskId,
        rawPages: ['page1.jpg'],
      };

      const result = await controller.create(createSubmissionDto);
      expect(result).toHaveProperty('_id');
      expect(result.studentId).toEqual(createSubmissionDto.studentId);
      expect(result.taskId).toEqual(createSubmissionDto.taskId);
      expect(service.create).toHaveBeenCalledWith(createSubmissionDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of submissions', async () => {
      const result = await controller.findAll();
      expect(result).toEqual(mockSubmissions);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single submission', async () => {
      const result = await controller.findOne(mockSubmissionId);
      expect(result).toEqual(mockSubmission);
      expect(service.findOne).toHaveBeenCalledWith(mockSubmissionId);
    });

    it('should throw NotFoundException if submission not found', async () => {
      await expect(controller.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByTask', () => {
    it('should return submissions for a specific task', async () => {
      const result = await controller.findByTask(mockTaskId);
      expect(result).toEqual(expect.arrayContaining(mockSubmissions));
      expect(service.findByTask).toHaveBeenCalledWith(mockTaskId);
    });
  });

  describe('findByStudent', () => {
    it('should return submissions for a specific student', async () => {
      const result = await controller.findByStudent(mockStudentId);
      expect(result).toContainEqual(mockSubmission);
      expect(service.findByStudent).toHaveBeenCalledWith(mockStudentId);
    });
  });

  describe('findByStudentAndTask', () => {
    it('should return a submission for a specific student and task', async () => {
      const result = await controller.findByStudentAndTask(mockStudentId, mockTaskId);
      expect(result).toEqual(mockSubmission);
      expect(service.findByStudentAndTask).toHaveBeenCalledWith(mockStudentId, mockTaskId);
    });

    it('should throw NotFoundException if submission not found', async () => {
      mockSubmissionService.findByStudentAndTask.mockRejectedValueOnce(new NotFoundException('Submission not found'));
      await expect(controller.findByStudentAndTask('nonexistent-id', mockTaskId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a submission', async () => {
      const updateSubmissionDto: UpdateSubmissionDto = {
        status: SubmissionStatus.CORRECTED,
        reviewedAt: new Date(),
      };

      const result = await controller.update(mockSubmissionId, updateSubmissionDto);
      expect(result.status).toEqual(updateSubmissionDto.status);
      expect(service.update).toHaveBeenCalledWith(mockSubmissionId, updateSubmissionDto);
    });

    it('should throw NotFoundException if submission to update not found', async () => {
      const updateSubmissionDto: UpdateSubmissionDto = {
        status: SubmissionStatus.CORRECTED,
      };

      await expect(controller.update('nonexistent-id', updateSubmissionDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a submission', async () => {
      await controller.remove(mockSubmissionId);
      expect(service.remove).toHaveBeenCalledWith(mockSubmissionId);
    });

    it('should throw NotFoundException if submission to delete not found', async () => {
      mockSubmissionService.remove.mockRejectedValueOnce(new NotFoundException('Submission not found'));
      await expect(controller.remove('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });
}); 