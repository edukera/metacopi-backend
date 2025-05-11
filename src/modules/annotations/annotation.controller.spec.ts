import { Test, TestingModule } from '@nestjs/testing';
import { AnnotationController } from './annotation.controller';
import { AnnotationService } from './annotation.service';
import { CreateAnnotationDto, UpdateAnnotationDto, AnnotationResponseDto } from './annotation.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Annotation } from './annotation.schema';

describe('AnnotationController', () => {
  let controller: AnnotationController;
  let service: AnnotationService;

  const mockAnnotation = {
    id: 'annotation-id-123',
    correctionId: 'correction-id-123',
    key: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    pageId: 'p1',
    value: '{"type":"text","content":"Test annotation","position":{"x":100,"y":200}}',
    commentIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnnotationController],
      providers: [
        {
          provide: AnnotationService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockAnnotation),
            findByCorrection: jest.fn().mockResolvedValue([mockAnnotation]),
            findById: jest.fn().mockResolvedValue(mockAnnotation),
            update: jest.fn().mockResolvedValue(mockAnnotation),
            remove: jest.fn().mockResolvedValue(mockAnnotation),
            verifyTeacherAccess: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    controller = module.get<AnnotationController>(AnnotationController);
    service = module.get<AnnotationService>(AnnotationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new annotation', async () => {
      const createAnnotationDto: CreateAnnotationDto = {
        id: 'annotation-id-123',
        correctionId: 'correction-id-123',
        pageId: 'p1',
        value: '{"type":"text","content":"Test annotation","position":{"x":100,"y":200}}',
      };

      const result = await controller.create('correction-id-123', createAnnotationDto);

      expect(service.verifyTeacherAccess).toHaveBeenCalledWith('correction-id-123');
      expect(service.create).toHaveBeenCalledWith(createAnnotationDto);
      expect(result).toEqual(mockAnnotation);
    });

    it('should throw BadRequestException when correction ID in URL does not match DTO', async () => {
      const createAnnotationDto: CreateAnnotationDto = {
        id: 'annotation-id-123',
        correctionId: 'different-correction-id',
        pageId: 'p1',
        value: '{"type":"text","content":"Test annotation","position":{"x":100,"y":200}}',
      };

      await expect(controller.create('correction-id-123', createAnnotationDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByCorrection', () => {
    it('should return an array of annotations for a correction', async () => {
      const result = await controller.findByCorrection('correction-id-123');

      expect(service.findByCorrection).toHaveBeenCalledWith('correction-id-123');
      expect(result).toEqual([mockAnnotation]);
    });
  });

  describe('findOne', () => {
    it('should return an annotation by ID', async () => {
      const result = await controller.findOne('correction-id-123', 'annotation-id-123');

      expect(service.findById).toHaveBeenCalledWith('annotation-id-123');
      expect(result).toEqual(mockAnnotation);
    });

    it('should throw NotFoundException when annotation does not belong to the correction', async () => {
      const mockAnnotationWithDifferentCorrectionId: AnnotationResponseDto = {
        id: 'annotation-id-123',
        correctionId: 'different-correction-id',
        pageId: 'p1',
        value: '{"type":"text","content":"Test annotation","position":{"x":100,"y":200}}',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdByEmail: 'teacher@metacopi.com',
      };

      jest.spyOn(service, 'findById').mockResolvedValue(mockAnnotationWithDifferentCorrectionId);

      await expect(controller.findOne('correction-id-123', 'annotation-id-123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an annotation', async () => {
      const updateAnnotationDto: UpdateAnnotationDto = {
        value: '{"type":"text","content":"Updated annotation","position":{"x":100,"y":200}}',
      };

      const result = await controller.update('correction-id-123', 'annotation-id-123', updateAnnotationDto);

      expect(service.findById).toHaveBeenCalledWith('annotation-id-123');
      expect(service.verifyTeacherAccess).toHaveBeenCalledWith('correction-id-123');
      expect(service.update).toHaveBeenCalledWith('annotation-id-123', updateAnnotationDto);
      expect(result).toEqual(mockAnnotation);
    });

    it('should throw NotFoundException when annotation does not belong to the correction', async () => {
      const mockAnnotationWithDifferentCorrectionId: AnnotationResponseDto = {
        id: 'annotation-id-123',
        correctionId: {
          toString: () => 'different-correction-id'
        } as any,
        pageId: 'p1',
        value: '{"type":"text","content":"Test annotation","position":{"x":100,"y":200}}',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdByEmail: 'teacher@metacopi.com',
      };

      jest.spyOn(service, 'findById').mockResolvedValue(mockAnnotationWithDifferentCorrectionId);

      const updateAnnotationDto: UpdateAnnotationDto = {
        value: '{"type":"text","content":"Updated annotation","position":{"x":100,"y":200}}',
      };

      await expect(
        controller.update('correction-id-123', 'annotation-id-123', updateAnnotationDto)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete an annotation', async () => {
      await controller.remove('correction-id-123', 'annotation-id-123');

      expect(service.findById).toHaveBeenCalledWith('annotation-id-123');
      expect(service.verifyTeacherAccess).toHaveBeenCalledWith('correction-id-123');
      expect(service.remove).toHaveBeenCalledWith('annotation-id-123');
    });

    it('should throw NotFoundException when annotation does not belong to the correction', async () => {
      const mockAnnotationWithDifferentCorrectionId: AnnotationResponseDto = {
        id: 'annotation-id-123',
        correctionId: {
          toString: () => 'different-correction-id'
        } as any,
        pageId: 'p1',
        value: '{"type":"text","content":"Test annotation","position":{"x":100,"y":200}}',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdByEmail: 'teacher@metacopi.com',
      };

      jest.spyOn(service, 'findById').mockResolvedValue(mockAnnotationWithDifferentCorrectionId);

      await expect(controller.remove('correction-id-123', 'annotation-id-123')).rejects.toThrow(NotFoundException);
    });
  });
}); 