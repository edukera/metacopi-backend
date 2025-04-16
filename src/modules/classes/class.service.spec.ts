import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ClassService } from './class.service';
import { Class } from './class.schema';
import { MembershipService } from '../memberships/membership.service';
import { MembershipRole } from '../memberships/membership.schema';
import { classStub, createClassDto, updateClassDto } from '../../../test/factories/class.factory';

describe('ClassService', () => {
  let service: ClassService;
  let model: any;
  let membershipService: any;
  const mockRequest = { 
    user: { 
      sub: new Types.ObjectId().toString(), 
      role: 'user' 
    } 
  };

  beforeEach(async () => {
    // Create mocks
    const mockModel = {
      find: jest.fn().mockReturnThis(),
      findById: jest.fn().mockReturnThis(),
      findOne: jest.fn().mockReturnThis(),
      findByIdAndUpdate: jest.fn().mockReturnThis(),
      findByIdAndDelete: jest.fn().mockReturnThis(),
      exec: jest.fn(),
      new: jest.fn().mockImplementation(dto => ({
        ...dto,
        _id: new Types.ObjectId(),
        save: jest.fn().mockReturnValue({
          ...dto,
          _id: new Types.ObjectId(),
        }),
      })),
    };

    const mockMembershipService = {
      create: jest.fn(),
      findByUser: jest.fn(),
      findByUserAndClass: jest.fn(),
      deleteByClass: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassService,
        {
          provide: getModelToken(Class.name),
          useValue: mockModel,
        },
        {
          provide: MembershipService,
          useValue: mockMembershipService,
        },
        {
          provide: 'REQUEST',
          useValue: mockRequest,
        },
      ],
    }).compile();

    service = module.get<ClassService>(ClassService);
    model = module.get(getModelToken(Class.name));
    membershipService = module.get<MembershipService>(MembershipService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all classes as admin', async () => {
      // Arrange
      const classes = [classStub(), classStub()];
      mockRequest.user.role = 'admin';
      model.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(classes),
      });

      // Act
      const result = await service.findAll();

      // Assert
      expect(model.find).toHaveBeenCalledWith({ archived: false });
      expect(result).toEqual(classes);
    });

    it('should return only user classes as non-admin', async () => {
      // Arrange
      const userId = mockRequest.user.sub;
      mockRequest.user.role = 'user';
      const classes = [classStub(), classStub()];
      const memberships = [
        { classId: classes[0]._id.toString() },
        { classId: classes[1]._id.toString() },
      ];

      membershipService.findByUser.mockResolvedValue(memberships);
      model.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(classes),
      });

      // Act
      const result = await service.findAll();

      // Assert
      expect(membershipService.findByUser).toHaveBeenCalledWith(userId);
      expect(model.find).toHaveBeenCalledWith({ 
        _id: { $in: memberships.map(m => m.classId) }, 
        archived: false 
      });
      expect(result).toEqual(classes);
    });
  });

  describe('findOne', () => {
    it('should return a class by id', async () => {
      // Arrange
      const classEntity = classStub();
      const id = classEntity._id.toString();
      
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(classEntity),
      });

      // Act
      const result = await service.findOne(id);

      // Assert
      expect(model.findById).toHaveBeenCalledWith(id);
      expect(result).toEqual(classEntity);
    });

    it('should throw NotFoundException if class not found', async () => {
      // Arrange
      const id = new Types.ObjectId().toString();
      
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act & Assert
      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
      expect(model.findById).toHaveBeenCalledWith(id);
    });
  });

  describe('findByCode', () => {
    it('should return a class by code', async () => {
      // Arrange
      const classEntity = classStub();
      const code = classEntity.code;
      
      model.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(classEntity),
      });

      // Act
      const result = await service.findByCode(code);

      // Assert
      expect(model.findOne).toHaveBeenCalledWith({ code });
      expect(result).toEqual(classEntity);
    });

    it('should throw NotFoundException if class not found by code', async () => {
      // Arrange
      const code = 'INVALID';
      
      model.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act & Assert
      await expect(service.findByCode(code)).rejects.toThrow(NotFoundException);
      expect(model.findOne).toHaveBeenCalledWith({ code });
    });
  });

  describe('update', () => {
    it('should update a class', async () => {
      // Arrange
      const classEntity = classStub();
      const id = classEntity._id.toString();
      const updateDto = updateClassDto({ name: 'Updated Class' });
      const updatedClass = { ...classEntity, name: 'Updated Class' };
      
      model.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedClass),
      });

      // Act
      const result = await service.update(id, updateDto);

      // Assert
      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(id, updateDto, { new: true });
      expect(result).toEqual(updatedClass);
    });

    it('should throw NotFoundException if class not found during update', async () => {
      // Arrange
      const id = new Types.ObjectId().toString();
      const updateDto = updateClassDto({ name: 'Updated Class' });
      
      model.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act & Assert
      await expect(service.update(id, updateDto)).rejects.toThrow(NotFoundException);
      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(id, updateDto, { new: true });
    });
  });

  describe('remove', () => {
    it('should remove a class and delete associated memberships', async () => {
      // Arrange
      const classEntity = classStub();
      const id = classEntity._id.toString();
      
      model.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(classEntity),
      });

      // Act
      await service.remove(id);

      // Assert
      expect(model.findByIdAndDelete).toHaveBeenCalledWith(id);
      expect(membershipService.deleteByClass).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException if class not found during remove', async () => {
      // Arrange
      const id = new Types.ObjectId().toString();
      
      model.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act & Assert
      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
      expect(model.findByIdAndDelete).toHaveBeenCalledWith(id);
      expect(membershipService.deleteByClass).not.toHaveBeenCalled();
    });
  });

  describe('archive', () => {
    it('should set archived to true for a class', async () => {
      // Arrange
      const classEntity = classStub();
      const id = classEntity._id.toString();
      
      classEntity.save = jest.fn().mockResolvedValue({ ...classEntity, archived: true });
      
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(classEntity),
      });

      // Act
      const result = await service.archive(id);

      // Assert
      expect(model.findById).toHaveBeenCalledWith(id);
      expect(classEntity.archived).toBe(true);
      expect(classEntity.save).toHaveBeenCalled();
      expect(result.archived).toBe(true);
    });

    it('should throw NotFoundException if class not found during archive', async () => {
      // Arrange
      const id = new Types.ObjectId().toString();
      
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act & Assert
      await expect(service.archive(id)).rejects.toThrow(NotFoundException);
      expect(model.findById).toHaveBeenCalledWith(id);
    });
  });

  describe('regenerateCode', () => {
    it('should generate a new code for a class', async () => {
      // Arrange
      const classEntity = classStub();
      const id = classEntity._id.toString();
      const originalCode = classEntity.code;
      
      classEntity.save = jest.fn().mockImplementation(function() {
        return Promise.resolve(this);
      });
      
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(classEntity),
      });

      // Act
      const result = await service.regenerateCode(id);

      // Assert
      expect(model.findById).toHaveBeenCalledWith(id);
      expect(classEntity.save).toHaveBeenCalled();
      expect(result.code).not.toEqual(originalCode);
      expect(classEntity.code).toEqual(result.code);
    });

    it('should throw NotFoundException if class not found during regenerateCode', async () => {
      // Arrange
      const id = new Types.ObjectId().toString();
      
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act & Assert
      await expect(service.regenerateCode(id)).rejects.toThrow(NotFoundException);
      expect(model.findById).toHaveBeenCalledWith(id);
    });
  });

  describe('joinClass', () => {
    it('should create a membership when joining a class with valid code', async () => {
      // Arrange
      const classEntity = classStub();
      const id = classEntity._id.toString();
      const code = classEntity.code;
      const userId = mockRequest.user.sub;
      
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(classEntity),
      });
      
      membershipService.findByUserAndClass.mockResolvedValue(null);

      // Act
      await service.joinClass(id, code);

      // Assert
      expect(model.findById).toHaveBeenCalledWith(id);
      expect(membershipService.findByUserAndClass).toHaveBeenCalledWith(userId, id);
      expect(membershipService.create).toHaveBeenCalledWith({
        userId,
        classId: id,
        role: MembershipRole.STUDENT,
      });
    });

    it('should throw BadRequestException if code is invalid', async () => {
      // Arrange
      const classEntity = classStub();
      const id = classEntity._id.toString();
      const invalidCode = 'INVALID';
      
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(classEntity),
      });

      // Act & Assert
      await expect(service.joinClass(id, invalidCode)).rejects.toThrow(BadRequestException);
      expect(model.findById).toHaveBeenCalledWith(id);
      expect(membershipService.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if class is archived', async () => {
      // Arrange
      const classEntity = classStub({ archived: true });
      const id = classEntity._id.toString();
      const code = classEntity.code;
      
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(classEntity),
      });

      // Act & Assert
      await expect(service.joinClass(id, code)).rejects.toThrow(BadRequestException);
      expect(model.findById).toHaveBeenCalledWith(id);
      expect(membershipService.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if user is already a member', async () => {
      // Arrange
      const classEntity = classStub();
      const id = classEntity._id.toString();
      const code = classEntity.code;
      const userId = mockRequest.user.sub;
      
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(classEntity),
      });
      
      membershipService.findByUserAndClass.mockResolvedValue({ id: 'existing-membership' });

      // Act & Assert
      await expect(service.joinClass(id, code)).rejects.toThrow(BadRequestException);
      expect(model.findById).toHaveBeenCalledWith(id);
      expect(membershipService.findByUserAndClass).toHaveBeenCalledWith(userId, id);
      expect(membershipService.create).not.toHaveBeenCalled();
    });
  });
}); 