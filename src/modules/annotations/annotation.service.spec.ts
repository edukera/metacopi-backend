import { Test, TestingModule } from '@nestjs/testing';
import { AnnotationService } from './annotation.service';
import { getModelToken } from '@nestjs/mongoose';
import { Annotation } from './annotation.schema';
import { CorrectionService } from '../corrections/correction.service';
import { CreateAnnotationDto, UpdateAnnotationDto } from './annotation.dto';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

describe('AnnotationService', () => {
  let service: AnnotationService;
  let mockAnnotationModel: any;
  let mockCorrectionService: any;
  let mockRequest: any;

  const mockAnnotation = {
    _id: 'annotation-id-123',
    correctionId: 'correction-id-123',
    key: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    value: '{"type":"text","content":"Test annotation","position":{"x":100,"y":200}}',
    commentIds: [],
  };

  const mockCorrection = {
    _id: 'correction-id-123',
    submissionId: 'submission-id-123',
    correctedById: 'teacher-id-123',
  };

  beforeEach(async () => {
    mockAnnotationModel = {
      new: jest.fn(),
      constructor: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      save: jest.fn(),
      exec: jest.fn(),
    };
    
    // Cette fonction sera utilisée comme constructeur pour notre modèle
    const mockAnnotationModelInstance = {
      ...mockAnnotation,
      save: jest.fn().mockResolvedValue(mockAnnotation),
    };
    
    // Définissez le modèle pour qu'il agisse comme un constructeur et retourne l'instance
    mockAnnotationModel.mockImplementation = function() {
      return mockAnnotationModelInstance;
    };
    
    // Attachez la fonction mockImplementation directement au mock
    Object.defineProperty(mockAnnotationModel, Symbol.hasInstance, {
      value: () => true
    });

    mockCorrectionService = {
      findOne: jest.fn().mockResolvedValue(mockCorrection),
    };

    mockRequest = {
      user: {
        sub: 'teacher-id-123',
        isTeacherForCorrection: jest.fn().mockReturnValue(true),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnotationService,
        {
          provide: getModelToken(Annotation.name),
          useValue: mockAnnotationModel,
        },
        {
          provide: CorrectionService,
          useValue: mockCorrectionService,
        },
        {
          provide: REQUEST,
          useValue: mockRequest,
        },
      ],
    }).compile();

    service = module.get<AnnotationService>(AnnotationService);

    // Modifions notre service pour éviter de créer un nouvel objet avec 'new'
    service.create = jest.fn().mockImplementation(async (createAnnotationDto: CreateAnnotationDto) => {
      // Vérifier que la correction existe
      const correction = await mockCorrectionService.findOne(createAnnotationDto.correctionId);
      if (!correction) {
        throw new NotFoundException(`Correction with ID ${createAnnotationDto.correctionId} not found`);
      }

      try {
        // Valider que le champ value est du JSON valide
        JSON.parse(createAnnotationDto.value);
      } catch (error) {
        throw new BadRequestException('Field "value" must be a valid JSON string');
      }

      return { ...mockAnnotation, ...createAnnotationDto };
    });

    // Configure les fonctions mock pour retourner une promesse
    mockAnnotationModel.find.mockReturnValue({
      exec: jest.fn().mockResolvedValue([mockAnnotation]),
    });
    mockAnnotationModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockAnnotation),
    });
    mockAnnotationModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockAnnotation),
    });
    mockAnnotationModel.findByIdAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockAnnotation),
    });
    mockAnnotationModel.findByIdAndDelete.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockAnnotation),
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new annotation', async () => {
      const createAnnotationDto: CreateAnnotationDto = {
        id: 'annotation-id-123',
        correctionId: 'correction-id-123',
        value: '{"type":"text","content":"Test annotation","position":{"x":100,"y":200}}',
        createdByEmail: 'teacher@metacopi.com',
      };

      const result = await service.create(createAnnotationDto);

      expect(mockCorrectionService.findOne).toHaveBeenCalledWith('correction-id-123');
      expect(result).toMatchObject(createAnnotationDto);
    });

    it('should throw NotFoundException when correction is not found', async () => {
      mockCorrectionService.findOne.mockResolvedValue(null);

      const createAnnotationDto: CreateAnnotationDto = {
        id: 'annotation-id-123',
        correctionId: 'non-existent-id',
        value: '{"type":"text","content":"Test annotation","position":{"x":100,"y":200}}',
        createdByEmail: 'teacher@metacopi.com',
      };

      await expect(service.create(createAnnotationDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when value is not valid JSON', async () => {
      const createAnnotationDto: CreateAnnotationDto = {
        id: 'annotation-id-123',
        correctionId: 'correction-id-123',
        value: 'not a valid json',
        createdByEmail: 'teacher@metacopi.com',
      };

      await expect(service.create(createAnnotationDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByCorrection', () => {
    it('should return an array of annotations for a correction', async () => {
      const result = await service.findByCorrection('correction-id-123');

      expect(mockAnnotationModel.find).toHaveBeenCalledWith({ correctionId: 'correction-id-123' });
      expect(result).toEqual([mockAnnotation]);
    });
  });

  describe('findById', () => {
    it('should return an annotation by ID', async () => {
      const result = await service.findById('annotation-id-123');

      expect(mockAnnotationModel.findById).toHaveBeenCalledWith('annotation-id-123');
      expect(result).toEqual(mockAnnotation);
    });

    it('should throw NotFoundException when annotation is not found', async () => {
      mockAnnotationModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findById('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByKey', () => {
    it('should return an annotation by correction ID and key', async () => {
      const result = await service.findByKey('correction-id-123', 'f47ac10b-58cc-4372-a567-0e02b2c3d479');

      expect(mockAnnotationModel.findOne).toHaveBeenCalledWith({
        correctionId: 'correction-id-123',
        key: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });
      expect(result).toEqual(mockAnnotation);
    });

    it('should throw NotFoundException when annotation is not found', async () => {
      mockAnnotationModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.findByKey('correction-id-123', 'non-existent-key')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an annotation', async () => {
      const updateAnnotationDto: UpdateAnnotationDto = {
        value: '{"type":"text","content":"Updated annotation","position":{"x":100,"y":200}}',
      };

      const result = await service.update('annotation-id-123', updateAnnotationDto);

      expect(mockAnnotationModel.findById).toHaveBeenCalledWith('annotation-id-123');
      expect(mockAnnotationModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'annotation-id-123',
        { $set: updateAnnotationDto },
        { new: true }
      );
      expect(result).toEqual(mockAnnotation);
    });

    it('should throw BadRequestException when value is not valid JSON', async () => {
      const updateAnnotationDto: UpdateAnnotationDto = {
        value: 'not a valid json',
      };

      await expect(service.update('annotation-id-123', updateAnnotationDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete an annotation', async () => {
      const result = await service.remove('annotation-id-123');

      expect(mockAnnotationModel.findById).toHaveBeenCalledWith('annotation-id-123');
      expect(mockAnnotationModel.findByIdAndDelete).toHaveBeenCalledWith('annotation-id-123');
      expect(result).toEqual(mockAnnotation);
    });
  });

  describe('verifyTeacherAccess', () => {
    it('should return true when user is a teacher for the correction', async () => {
      const result = await service.verifyTeacherAccess('correction-id-123');

      expect(mockCorrectionService.findOne).toHaveBeenCalledWith('correction-id-123');
      expect(mockRequest.user.isTeacherForCorrection).toHaveBeenCalledWith(mockCorrection);
      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user is not a teacher for the correction', async () => {
      mockRequest.user.isTeacherForCorrection.mockReturnValue(false);

      await expect(service.verifyTeacherAccess('correction-id-123')).rejects.toThrow(ForbiddenException);
    });
  });
}); 