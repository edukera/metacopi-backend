import { Test, TestingModule } from '@nestjs/testing';
import { CorrectionController } from './correction.controller';
import { CorrectionService } from './correction.service';
import { CreateCorrectionDto, UpdateCorrectionDto } from './correction.dto';
import { NotFoundException } from '@nestjs/common';
import { Correction, CorrectionStatus, CorrectionDocument } from './correction.schema';
import mongoose, { Document } from 'mongoose';

describe('CorrectionController', () => {
  let controller: CorrectionController;
  let service: CorrectionService;

  const mockCorrectionId = new mongoose.Types.ObjectId().toString();
  const mockSubmissionId = new mongoose.Types.ObjectId().toString();
  const mockTeacherId = new mongoose.Types.ObjectId().toString();

  const mockCorrection = {
    _id: mockCorrectionId,
    submissionId: mockSubmissionId,
    correctedById: mockTeacherId,
    status: CorrectionStatus.IN_PROGRESS,
    grade: 15,
    appreciation: 'Good work!',
    annotations: 'Some detailed comments here',
    finalizedAt: null,
    createdAt: new Date(),
  } as unknown as CorrectionDocument;

  const mockCorrections = [
    mockCorrection,
    {
      _id: new mongoose.Types.ObjectId().toString(),
      submissionId: new mongoose.Types.ObjectId().toString(),
      correctedById: mockTeacherId,
      status: CorrectionStatus.COMPLETED,
      grade: 18,
      appreciation: 'Excellent work!',
      annotations: 'Very detailed comments',
      finalizedAt: new Date(),
      createdAt: new Date(),
    } as unknown as CorrectionDocument
  ];

  // Mock CorrectionService
  const mockCorrectionService = {
    create: jest.fn().mockImplementation((dto: CreateCorrectionDto) => {
      const newCorrection = {
        _id: new mongoose.Types.ObjectId().toString(),
        ...dto,
        status: CorrectionStatus.IN_PROGRESS,
        grade: dto.grade || null,
        appreciation: dto.appreciation || '',
        annotations: dto.annotations || '',
        finalizedAt: null,
        createdAt: new Date(),
      } as unknown as CorrectionDocument;
      return Promise.resolve(newCorrection);
    }),
    findAll: jest.fn().mockResolvedValue(mockCorrections),
    findOne: jest.fn().mockImplementation((id: string) => {
      const correction = mockCorrections.find(c => c._id.toString() === id);
      if (!correction) {
        throw new NotFoundException(`Correction with ID ${id} not found`);
      }
      return Promise.resolve(correction);
    }),
    findBySubmission: jest.fn().mockImplementation((submissionId: string) => {
      const correction = mockCorrections.find(c => c.submissionId === submissionId);
      if (!correction) {
        throw new NotFoundException(`Correction for submission ${submissionId} not found`);
      }
      return Promise.resolve(correction);
    }),
    findByTeacher: jest.fn().mockImplementation((teacherId: string) => {
      const corrections = mockCorrections.filter(c => c.correctedById === teacherId);
      return Promise.resolve(corrections);
    }),
    update: jest.fn().mockImplementation((id: string, dto: UpdateCorrectionDto) => {
      const correctionIndex = mockCorrections.findIndex(c => c._id.toString() === id);
      if (correctionIndex === -1) {
        throw new NotFoundException(`Correction with ID ${id} not found`);
      }
      
      const updatedCorrection = { ...mockCorrections[correctionIndex], ...dto };
      
      // Set finalizedAt date if status changes to COMPLETED
      if (dto.status === CorrectionStatus.COMPLETED && mockCorrections[correctionIndex].status !== CorrectionStatus.COMPLETED) {
        updatedCorrection.finalizedAt = new Date();
      }
      
      return Promise.resolve(updatedCorrection as unknown as CorrectionDocument);
    }),
    remove: jest.fn().mockImplementation((id: string) => {
      const correctionIndex = mockCorrections.findIndex(c => c._id.toString() === id);
      if (correctionIndex === -1) {
        throw new NotFoundException(`Correction with ID ${id} not found`);
      }
      return Promise.resolve();
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CorrectionController],
      providers: [
        {
          provide: CorrectionService,
          useValue: mockCorrectionService,
        },
      ],
    }).compile();

    controller = module.get<CorrectionController>(CorrectionController);
    service = module.get<CorrectionService>(CorrectionService);

    // Reset mock counters
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new correction', async () => {
      const createCorrectionDto: CreateCorrectionDto = {
        submissionId: mockSubmissionId,
        correctedById: mockTeacherId,
        grade: 15,
        appreciation: 'Good work!',
        annotations: 'Some detailed comments here',
      };

      const result = await controller.create(createCorrectionDto);
      expect(result).toHaveProperty('_id');
      expect(result.submissionId).toEqual(createCorrectionDto.submissionId);
      expect(result.correctedById).toEqual(createCorrectionDto.correctedById);
      expect(result.grade).toEqual(createCorrectionDto.grade);
      expect(service.create).toHaveBeenCalledWith(createCorrectionDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of corrections', async () => {
      const result = await controller.findAll();
      expect(result).toEqual(mockCorrections);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single correction', async () => {
      const result = await controller.findOne(mockCorrectionId);
      expect(result).toEqual(mockCorrection);
      expect(service.findOne).toHaveBeenCalledWith(mockCorrectionId);
    });

    it('should throw NotFoundException if correction not found', async () => {
      await expect(controller.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySubmission', () => {
    it('should return a correction for a specific submission', async () => {
      const result = await controller.findBySubmission(mockSubmissionId);
      expect(result).toEqual(mockCorrection);
      expect(service.findBySubmission).toHaveBeenCalledWith(mockSubmissionId);
    });

    it('should throw NotFoundException if correction for submission not found', async () => {
      mockCorrectionService.findBySubmission.mockRejectedValueOnce(
        new NotFoundException(`Correction for submission nonexistent-id not found`)
      );
      await expect(controller.findBySubmission('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByTeacher', () => {
    it('should return corrections for a specific teacher', async () => {
      const result = await controller.findByTeacher(mockTeacherId);
      expect(result).toEqual(expect.arrayContaining(mockCorrections));
      expect(service.findByTeacher).toHaveBeenCalledWith(mockTeacherId);
    });
  });

  describe('update', () => {
    it('should update a correction', async () => {
      const updateCorrectionDto: UpdateCorrectionDto = {
        grade: 17,
        appreciation: 'Updated appreciation',
        status: CorrectionStatus.COMPLETED,
      };

      const result = await controller.update(mockCorrectionId, updateCorrectionDto);
      expect(result.grade).toEqual(updateCorrectionDto.grade);
      expect(result.appreciation).toEqual(updateCorrectionDto.appreciation);
      expect(result.status).toEqual(updateCorrectionDto.status);
      expect(result.finalizedAt).toBeDefined();
      expect(service.update).toHaveBeenCalledWith(mockCorrectionId, updateCorrectionDto);
    });

    it('should throw NotFoundException if correction to update not found', async () => {
      const updateCorrectionDto: UpdateCorrectionDto = {
        grade: 17,
      };

      await expect(controller.update('nonexistent-id', updateCorrectionDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a correction', async () => {
      await controller.remove(mockCorrectionId);
      expect(service.remove).toHaveBeenCalledWith(mockCorrectionId);
    });

    it('should throw NotFoundException if correction to delete not found', async () => {
      mockCorrectionService.remove.mockRejectedValueOnce(new NotFoundException('Correction not found'));
      await expect(controller.remove('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });
}); 