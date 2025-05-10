import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CorrectionService } from './correction.service';
import { Correction, CorrectionStatus } from './correction.schema';
import { REQUEST } from '@nestjs/core';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateCorrectionDto, UpdateCorrectionDto } from './correction.dto';
import { Document } from 'mongoose';

// Simple type for mocks that only need certain properties
type MockCorrection = {
  id: string;
  submissionId: string;
  correctedById?: string;
  grade?: number;
  appreciation?: string;
  status?: CorrectionStatus;
  createdAt?: Date;
  finalizedAt?: Date | null;
  save?: jest.Mock;
};

const mockRequest = {
  user: {
    sub: 'teacher-id-123',
  },
};

describe('CorrectionService', () => {
  let service: CorrectionService;
  let mockCorrectionModel: any;

  beforeEach(async () => {
    // Create a mock Mongoose Correction with constructor
    const mockCorrection = {
      id: 'correction-id-123',
      submissionId: 'submission-id-123',
      correctedById: 'teacher-id-123',
      grade: 85,
      appreciation: 'Good work',
      annotations: '',
      status: CorrectionStatus.IN_PROGRESS,
      createdAt: new Date(),
      finalizedAt: null,
      save: jest.fn().mockResolvedValue({
        id: 'correction-id-123',
        submissionId: 'submission-id-123',
        correctedById: 'teacher-id-123',
        grade: 85,
        appreciation: 'Good work',
        annotations: '',
        status: CorrectionStatus.IN_PROGRESS,
        createdAt: new Date(),
        finalizedAt: null,
      }),
    };
    
    // Configure all necessary mocks
    mockCorrectionModel = function() {
      return mockCorrection;
    };
    
    // Add model methods
    mockCorrectionModel.find = jest.fn().mockReturnThis();
    mockCorrectionModel.findOne = jest.fn().mockReturnThis();
    mockCorrectionModel.findById = jest.fn().mockReturnThis();
    mockCorrectionModel.findByIdAndUpdate = jest.fn().mockReturnThis();
    mockCorrectionModel.findByIdAndDelete = jest.fn().mockReturnThis();
    mockCorrectionModel.deleteMany = jest.fn().mockReturnThis();
    mockCorrectionModel.sort = jest.fn().mockReturnThis();
    mockCorrectionModel.exec = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CorrectionService,
        {
          provide: getModelToken(Correction.name),
          useValue: mockCorrectionModel,
        },
        {
          provide: REQUEST,
          useValue: mockRequest,
        },
      ],
    }).compile();

    service = module.get<CorrectionService>(CorrectionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new correction', async () => {
      const createDto: CreateCorrectionDto = {
        id: 'CORR-2024-001',
        submissionId: 'submission-id-123',
        correctedByEmail: 'teacher@metacopi.com',
        grade: 85,
        appreciation: 'Good work',
        status: CorrectionStatus.IN_PROGRESS,
      };

      // Important: simulate that no correction already exists
      mockCorrectionModel.findOne.mockReturnValueOnce(null);

      const result = await service.create(createDto) as MockCorrection;

      expect(mockCorrectionModel.findOne).toHaveBeenCalledWith({
        submissionId: createDto.submissionId,
      });
      expect(result).toBeDefined();
      expect(result.id).toBe('correction-id-123');
    });

    it('should use request user id if correctedById is not provided', async () => {
      const createDto: CreateCorrectionDto = {
        id: 'CORR-2024-001',
        submissionId: 'submission-id-123',
        correctedByEmail: 'teacher@metacopi.com',
        grade: 85,
        appreciation: 'Good work',
        status: CorrectionStatus.IN_PROGRESS,
      };

      // Important: simulate that no correction already exists
      mockCorrectionModel.findOne.mockReturnValueOnce(null);

      const result = await service.create(createDto) as MockCorrection;

      expect(result.correctedById).toBe(mockRequest.user.sub);
    });

    it('should throw BadRequestException if correction already exists', async () => {
      const createDto: CreateCorrectionDto = {
        id: 'CORR-2024-001',
        submissionId: 'submission-id-123',
        correctedByEmail: 'teacher-id-123',
        grade: 85,
        appreciation: 'Good work',
        status: CorrectionStatus.IN_PROGRESS,
      };

      // Mock to simulate that a correction already exists
      mockCorrectionModel.findOne.mockReturnValueOnce({
        id: 'existing-correction-id',
        submissionId: 'submission-id-123',
        annotations: '',
      });

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all corrections', async () => {
      const corrections = [
        { id: 'correction-1', submissionId: 'submission-1' },
        { id: 'correction-2', submissionId: 'submission-2' },
      ] as MockCorrection[];

      mockCorrectionModel.find.mockImplementationOnce(() => ({
        exec: jest.fn().mockResolvedValue(corrections),
      }));

      const result = await service.findAll();

      expect(mockCorrectionModel.find).toHaveBeenCalled();
      expect(result).toEqual(corrections);
    });
  });

  describe('findOne', () => {
    it('should return a correction by id', async () => {
      const correction = {
        id: 'correction-id-123',
        submissionId: 'submission-id-123',
        annotations: '',
      } as MockCorrection;

      mockCorrectionModel.findById.mockImplementationOnce(() => ({
        exec: jest.fn().mockResolvedValue(correction),
      }));

      const result = await service.findOne('correction-id-123');

      expect(mockCorrectionModel.findById).toHaveBeenCalledWith('correction-id-123');
      expect(result).toEqual(correction);
    });

    it('should throw NotFoundException if correction not found', async () => {
      mockCorrectionModel.findById.mockImplementationOnce(() => ({
        exec: jest.fn().mockResolvedValue(null),
      }));

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySubmission', () => {
    it('should return a correction by submissionId', async () => {
      const correction = {
        id: 'correction-id-123',
        submissionId: 'submission-id-123',
        annotations: '',
      } as MockCorrection;

      mockCorrectionModel.findOne.mockImplementationOnce(() => ({
        exec: jest.fn().mockResolvedValue(correction),
      }));

      const result = await service.findBySubmission('submission-id-123');

      expect(mockCorrectionModel.findOne).toHaveBeenCalledWith({ submissionId: 'submission-id-123' });
      expect(result).toEqual(correction);
    });

    it('should throw NotFoundException if correction not found for submission', async () => {
      mockCorrectionModel.findOne.mockImplementationOnce(() => ({
        exec: jest.fn().mockResolvedValue(null),
      }));

      await expect(service.findBySubmission('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByTeacher', () => {
    it('should return corrections by teacherId', async () => {
      const corrections = [
        { id: 'correction-1', correctedById: 'teacher-id-123' },
        { id: 'correction-2', correctedById: 'teacher-id-123' },
      ] as MockCorrection[];

      mockCorrectionModel.find.mockImplementationOnce(() => ({
        exec: jest.fn().mockResolvedValue(corrections),
      }));

      const result = await service.findByTeacher('teacher-id-123');

      expect(mockCorrectionModel.find).toHaveBeenCalledWith({ correctedById: 'teacher-id-123' });
      expect(result).toEqual(corrections);
    });
  });

  describe('update', () => {
    it('should update a correction', async () => {
      const updateDto: UpdateCorrectionDto = {
        grade: 90,
        appreciation: 'Excellent work',
      };

      const existingCorrection = {
        id: 'correction-id-123',
        submissionId: 'submission-id-123',
        grade: 85,
        status: CorrectionStatus.IN_PROGRESS,
        annotations: '',
      } as MockCorrection;

      const updatedCorrection = {
        ...existingCorrection,
        ...updateDto,
      } as MockCorrection;

      // Mock for findOne (used by the service's findOne method)
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(existingCorrection as any);

      // Mock for findByIdAndUpdate
      mockCorrectionModel.findByIdAndUpdate.mockImplementationOnce(() => ({
        exec: jest.fn().mockResolvedValue(updatedCorrection),
      }));

      const result = await service.update('correction-id-123', updateDto);

      expect(service.findOne).toHaveBeenCalledWith('correction-id-123');
      expect(mockCorrectionModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'correction-id-123',
        updateDto,
        { new: true },
      );
      expect(result).toEqual(updatedCorrection);
    });

    it('should add finalizedAt when status changes to COMPLETED', async () => {
      const updateDto: UpdateCorrectionDto = {
        status: CorrectionStatus.COMPLETED,
      };

      const existingCorrection = {
        id: 'correction-id-123',
        submissionId: 'submission-id-123',
        status: CorrectionStatus.IN_PROGRESS,
        finalizedAt: null,
        annotations: '',
      } as MockCorrection;

      // Mock for findOne (used by the service's findOne method)
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(existingCorrection as any);

      // Mock for findByIdAndUpdate
      mockCorrectionModel.findByIdAndUpdate.mockImplementationOnce((id, update) => {
        // Verify that finalizedAt was added to the updateDto
        expect(update.finalizedAt).toBeDefined();
        return {
          exec: jest.fn().mockResolvedValue({
            ...existingCorrection,
            ...updateDto,
            finalizedAt: update.finalizedAt,
          } as MockCorrection),
        };
      });

      const result = await service.update('correction-id-123', updateDto);

      expect(result.finalizedAt).toBeDefined();
      expect(result.status).toBe(CorrectionStatus.COMPLETED);
    });

    it('should throw NotFoundException if updated correction not found', async () => {
      const updateDto: UpdateCorrectionDto = {
        grade: 90,
      };

      const existingCorrection = {
        id: 'correction-id-123',
        submissionId: 'submission-id-123',
        grade: 85,
        annotations: '',
      } as MockCorrection;

      // Mock for findOne (used by the service's findOne method)
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(existingCorrection as any);

      // Mock for findByIdAndUpdate returning null
      mockCorrectionModel.findByIdAndUpdate.mockImplementationOnce(() => ({
        exec: jest.fn().mockResolvedValue(null),
      }));

      await expect(service.update('correction-id-123', updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a correction', async () => {
      const correction = {
        id: 'correction-id-123',
        submissionId: 'submission-id-123',
        annotations: '',
      } as MockCorrection;

      mockCorrectionModel.findByIdAndDelete.mockImplementationOnce(() => ({
        exec: jest.fn().mockResolvedValue(correction),
      }));

      const result = await service.remove('correction-id-123');

      expect(mockCorrectionModel.findByIdAndDelete).toHaveBeenCalledWith('correction-id-123');
      expect(result).toEqual(correction);
    });

    it('should throw NotFoundException if correction not found', async () => {
      mockCorrectionModel.findByIdAndDelete.mockImplementationOnce(() => ({
        exec: jest.fn().mockResolvedValue(null),
      }));

      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeBySubmission', () => {
    it('should remove corrections by submissionId', async () => {
      mockCorrectionModel.deleteMany.mockImplementationOnce(() => ({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      }));

      await service.removeBySubmission('submission-id-123');

      expect(mockCorrectionModel.deleteMany).toHaveBeenCalledWith({ submissionId: 'submission-id-123' });
    });
  });
}); 