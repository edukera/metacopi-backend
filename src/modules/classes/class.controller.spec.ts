import { Test, TestingModule } from '@nestjs/testing';
import { ClassController } from './class.controller';
import { ClassService } from './class.service';
import { CreateClassDto, UpdateClassDto } from './class.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Class } from './class.schema';
import mongoose from 'mongoose';

describe('ClassController', () => {
  let controller: ClassController;
  let service: ClassService;

  const mockClassId = new mongoose.Types.ObjectId().toString();
  const mockUserId = new mongoose.Types.ObjectId().toString();

  const mockClass = {
    _id: mockClassId,
    name: 'Test Class',
    description: 'Test Description',
    createdBy: mockUserId,
    archived: false,
    code: 'ABC123',
    settings: {},
    toJSON: function() {
      return this;
    }
  } as unknown as Class;

  const mockClasses = [
    mockClass,
    {
      _id: new mongoose.Types.ObjectId().toString(),
      name: 'Another Class',
      description: 'Another Description',
      createdBy: mockUserId,
      archived: false,
      code: 'DEF456',
      settings: {},
      toJSON: function() {
        return this;
      }
    } as unknown as Class
  ];

  // Mock ClassService
  const mockClassService = {
    findAll: jest.fn().mockImplementation((archived = false) => {
      return Promise.resolve(mockClasses.filter(c => c.archived === archived));
    }),
    findOne: jest.fn().mockImplementation((id: string) => {
      const foundClass = mockClasses.find(c => c._id.toString() === id);
      if (!foundClass) {
        throw new NotFoundException(`Class with ID ${id} not found`);
      }
      return Promise.resolve(foundClass);
    }),
    create: jest.fn().mockImplementation((dto: CreateClassDto) => {
      const newClass = {
        _id: new mongoose.Types.ObjectId().toString(),
        ...dto,
        createdBy: mockUserId,
        archived: false,
        code: 'NEW789',
        settings: {},
        toJSON: function() {
          return this;
        }
      } as unknown as Class;
      return Promise.resolve(newClass);
    }),
    update: jest.fn().mockImplementation((id: string, dto: UpdateClassDto) => {
      const classIndex = mockClasses.findIndex(c => c._id.toString() === id);
      if (classIndex === -1) {
        throw new NotFoundException(`Class with ID ${id} not found`);
      }
      const updatedClass = { ...mockClasses[classIndex], ...dto };
      return Promise.resolve(updatedClass as Class);
    }),
    remove: jest.fn().mockImplementation((id: string) => {
      const classIndex = mockClasses.findIndex(c => c._id.toString() === id);
      if (classIndex === -1) {
        throw new NotFoundException(`Class with ID ${id} not found`);
      }
      return Promise.resolve();
    }),
    archive: jest.fn().mockImplementation((id: string) => {
      const classIndex = mockClasses.findIndex(c => c._id.toString() === id);
      if (classIndex === -1) {
        throw new NotFoundException(`Class with ID ${id} not found`);
      }
      const archivedClass = { ...mockClasses[classIndex], archived: true };
      return Promise.resolve(archivedClass as Class);
    }),
    regenerateCode: jest.fn().mockImplementation((id: string) => {
      const classIndex = mockClasses.findIndex(c => c._id.toString() === id);
      if (classIndex === -1) {
        throw new NotFoundException(`Class with ID ${id} not found`);
      }
      return Promise.resolve({ code: 'NEW789' });
    }),
    findByCode: jest.fn().mockImplementation((code: string) => {
      const foundClass = mockClasses.find(c => c.code === code);
      if (!foundClass) {
        throw new NotFoundException(`Class with code ${code} not found`);
      }
      return Promise.resolve(foundClass);
    }),
    joinClass: jest.fn().mockImplementation((id: string, code: string) => {
      const classIndex = mockClasses.findIndex(c => c._id.toString() === id);
      if (classIndex === -1) {
        throw new NotFoundException(`Class with ID ${id} not found`);
      }
      if (mockClasses[classIndex].code !== code) {
        throw new BadRequestException('Invalid invitation code');
      }
      return Promise.resolve();
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClassController],
      providers: [
        {
          provide: ClassService,
          useValue: mockClassService,
        },
      ],
    }).compile();

    controller = module.get<ClassController>(ClassController);
    service = module.get<ClassService>(ClassService);

    // Reset mock counters
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of classes', async () => {
      const result = await controller.findAll();
      expect(result).toEqual(mockClasses);
      expect(service.findAll).toHaveBeenCalled();
    });

    it('should return only archived classes when archived is true', async () => {
      mockClassService.findAll.mockImplementationOnce((archived = false) => {
        return Promise.resolve(mockClasses.filter(c => c.archived === true));
      });

      const result = await controller.findAll(true);
      expect(result).toHaveLength(0); // No archived classes in our mock
      expect(service.findAll).toHaveBeenCalledWith(true);
    });
  });

  describe('findById', () => {
    it('should return a single class', async () => {
      const result = await controller.findById(mockClassId);
      expect(result).toEqual(mockClass);
      expect(service.findOne).toHaveBeenCalledWith(mockClassId);
    });

    it('should throw NotFoundException if class not found', async () => {
      await expect(controller.findById('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new class', async () => {
      const createClassDto: CreateClassDto = {
        id: 'CLASS-123',
        name: 'New Class',
        description: 'New Description',
        createdByEmail: 'teacher@metacopi.com',
      };

      const result = await controller.create(createClassDto);
      expect(result).toHaveProperty('_id');
      expect(result.name).toEqual(createClassDto.name);
      expect(result.description).toEqual(createClassDto.description);
      expect(service.create).toHaveBeenCalledWith(createClassDto);
    });
  });

  describe('update', () => {
    it('should update a class', async () => {
      const updateClassDto: UpdateClassDto = {
        name: 'Updated Class',
        description: 'Updated Description',
      };

      const result = await controller.update(mockClassId, updateClassDto);
      expect(result.name).toEqual(updateClassDto.name);
      expect(result.description).toEqual(updateClassDto.description);
      expect(service.update).toHaveBeenCalledWith(mockClassId, updateClassDto);
    });

    it('should throw NotFoundException if class to update not found', async () => {
      const updateClassDto: UpdateClassDto = {
        name: 'Updated Class',
      };

      await expect(controller.update('nonexistent-id', updateClassDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a class', async () => {
      await controller.delete(mockClassId);
      expect(service.remove).toHaveBeenCalledWith(mockClassId);
    });

    it('should throw NotFoundException if class to delete not found', async () => {
      mockClassService.remove.mockRejectedValueOnce(new NotFoundException('Class not found'));
      await expect(controller.delete('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('archive', () => {
    it('should archive a class', async () => {
      const result = await controller.archive(mockClassId);
      expect(result.archived).toBe(true);
      expect(service.archive).toHaveBeenCalledWith(mockClassId);
    });

    it('should throw NotFoundException if class to archive not found', async () => {
      mockClassService.archive.mockRejectedValueOnce(new NotFoundException('Class not found'));
      await expect(controller.archive('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('regenerateCode', () => {
    it('should regenerate a class code', async () => {
      const result = await controller.regenerateCode(mockClassId);
      expect(result).toHaveProperty('code');
      expect(service.regenerateCode).toHaveBeenCalledWith(mockClassId);
    });

    it('should throw NotFoundException if class not found', async () => {
      mockClassService.regenerateCode.mockRejectedValueOnce(new NotFoundException('Class not found'));
      await expect(controller.regenerateCode('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCode', () => {
    it('should find a class by code', async () => {
      const result = await controller.findByCode(mockClass.code);
      expect(result).toEqual(mockClass);
      expect(service.findByCode).toHaveBeenCalledWith(mockClass.code);
    });

    it('should throw NotFoundException if class with code not found', async () => {
      await expect(controller.findByCode('nonexistent-code')).rejects.toThrow(NotFoundException);
    });
  });

  describe('joinClass', () => {
    it('should join a class with a valid code', async () => {
      await controller.joinClass(mockClassId, mockClass.code);
      expect(service.joinClass).toHaveBeenCalledWith(mockClassId, mockClass.code);
    });

    it('should throw BadRequestException if code is invalid', async () => {
      mockClassService.joinClass.mockRejectedValueOnce(new BadRequestException('Invalid invitation code'));
      await expect(controller.joinClass(mockClassId, 'invalid-code')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if class not found', async () => {
      mockClassService.joinClass.mockRejectedValueOnce(new NotFoundException('Class not found'));
      await expect(controller.joinClass('nonexistent-id', mockClass.code)).rejects.toThrow(NotFoundException);
    });
  });
}); 