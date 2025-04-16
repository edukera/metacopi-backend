import { Test, TestingModule } from '@nestjs/testing';
import { MembershipController } from './membership.controller';
import { MembershipService } from './membership.service';
import { CreateMembershipDto, UpdateMembershipDto } from './membership.dto';
import { NotFoundException } from '@nestjs/common';
import { Membership, MembershipRole, MembershipStatus, MembershipDocument } from './membership.schema';
import mongoose, { Document } from 'mongoose';

describe('MembershipController', () => {
  let controller: MembershipController;
  let service: MembershipService;

  const mockMembershipId = new mongoose.Types.ObjectId().toString();
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const mockClassId = new mongoose.Types.ObjectId().toString();
  const mockPaymentId = new mongoose.Types.ObjectId().toString();

  const mockMembership = {
    _id: mockMembershipId,
    userId: mockUserId,
    classId: mockClassId,
    role: MembershipRole.STUDENT,
    status: MembershipStatus.ACTIVE,
    joinedAt: new Date(),
    isActive: true,
  } as unknown as MembershipDocument;

  const mockMemberships = [
    mockMembership,
    {
      _id: new mongoose.Types.ObjectId().toString(),
      userId: new mongoose.Types.ObjectId().toString(),
      classId: mockClassId,
      role: MembershipRole.TEACHER,
      status: MembershipStatus.ACTIVE,
      joinedAt: new Date(),
      isActive: true,
    } as unknown as MembershipDocument
  ];

  // Mock MembershipService
  const mockMembershipService = {
    findAll: jest.fn().mockResolvedValue(mockMemberships),
    findOne: jest.fn().mockImplementation((id: string) => {
      const membership = mockMemberships.find(m => m._id.toString() === id);
      if (!membership) {
        throw new NotFoundException(`Membership with ID ${id} not found`);
      }
      return Promise.resolve(membership);
    }),
    create: jest.fn().mockImplementation((dto: CreateMembershipDto) => {
      const newMembership = {
        _id: new mongoose.Types.ObjectId().toString(),
        ...dto,
        joinedAt: new Date(),
        isActive: true,
      } as unknown as MembershipDocument;
      return Promise.resolve(newMembership);
    }),
    update: jest.fn().mockImplementation((id: string, dto: UpdateMembershipDto) => {
      const membershipIndex = mockMemberships.findIndex(m => m._id.toString() === id);
      if (membershipIndex === -1) {
        throw new NotFoundException(`Membership with ID ${id} not found`);
      }
      const updatedMembership = { ...mockMemberships[membershipIndex], ...dto };
      return Promise.resolve(updatedMembership as unknown as MembershipDocument);
    }),
    remove: jest.fn().mockImplementation((id: string) => {
      const membershipIndex = mockMemberships.findIndex(m => m._id.toString() === id);
      if (membershipIndex === -1) {
        throw new NotFoundException(`Membership with ID ${id} not found`);
      }
      return Promise.resolve();
    }),
    findByUser: jest.fn().mockImplementation((userId: string) => {
      const memberships = mockMemberships.filter(m => m.userId === userId);
      return Promise.resolve(memberships);
    }),
    findByClass: jest.fn().mockImplementation((classId: string) => {
      const memberships = mockMemberships.filter(m => m.classId === classId);
      return Promise.resolve(memberships);
    }),
    findByUserAndClass: jest.fn().mockImplementation((userId: string, classId: string) => {
      const membership = mockMemberships.find(m => m.userId === userId && m.classId === classId);
      return Promise.resolve(membership || null);
    }),
    deleteByClass: jest.fn().mockImplementation((classId: string) => {
      return Promise.resolve();
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MembershipController],
      providers: [
        {
          provide: MembershipService,
          useValue: mockMembershipService,
        },
      ],
    }).compile();

    controller = module.get<MembershipController>(MembershipController);
    service = module.get<MembershipService>(MembershipService);

    // Reset mock counters
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of memberships', async () => {
      const result = await controller.findAll();
      expect(result).toEqual(mockMemberships);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single membership', async () => {
      const result = await controller.findOne(mockMembershipId);
      expect(result).toEqual(mockMembership);
      expect(service.findOne).toHaveBeenCalledWith(mockMembershipId);
    });

    it('should throw NotFoundException if membership not found', async () => {
      await expect(controller.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new membership', async () => {
      const createMembershipDto: CreateMembershipDto = {
        userId: mockUserId,
        classId: mockClassId,
        role: MembershipRole.STUDENT,
      };

      const result = await controller.create(createMembershipDto);
      expect(result).toHaveProperty('_id');
      expect(result.userId).toEqual(createMembershipDto.userId);
      expect(result.classId).toEqual(createMembershipDto.classId);
      expect(service.create).toHaveBeenCalledWith(createMembershipDto);
    });
  });

  describe('update', () => {
    it('should update a membership', async () => {
      const updateMembershipDto: UpdateMembershipDto = {
        role: MembershipRole.TEACHER,
        status: MembershipStatus.ACTIVE,
      };

      const result = await controller.update(mockMembershipId, updateMembershipDto);
      expect(result.role).toEqual(updateMembershipDto.role);
      expect(result.status).toEqual(updateMembershipDto.status);
      expect(service.update).toHaveBeenCalledWith(mockMembershipId, updateMembershipDto);
    });

    it('should throw NotFoundException if membership to update not found', async () => {
      const updateMembershipDto: UpdateMembershipDto = {
        role: MembershipRole.TEACHER,
      };

      await expect(controller.update('nonexistent-id', updateMembershipDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a membership', async () => {
      await controller.remove(mockMembershipId);
      expect(service.remove).toHaveBeenCalledWith(mockMembershipId);
    });

    it('should throw NotFoundException if membership to delete not found', async () => {
      mockMembershipService.remove.mockRejectedValueOnce(new NotFoundException('Membership not found'));
      await expect(controller.remove('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByUser', () => {
    it('should return memberships for a specific user', async () => {
      const result = await controller.findByUser(mockUserId);
      expect(result).toContainEqual(mockMembership);
      expect(service.findByUser).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('findByClass', () => {
    it('should return memberships for a specific class', async () => {
      const result = await controller.findByClass(mockClassId);
      expect(result).toEqual(expect.arrayContaining(mockMemberships));
      expect(service.findByClass).toHaveBeenCalledWith(mockClassId);
    });
  });

  describe('findByUserAndClass', () => {
    it('should return a membership for a specific user and class', async () => {
      const result = await controller.findByUserAndClass(mockUserId, mockClassId);
      expect(result).toEqual(mockMembership);
      expect(service.findByUserAndClass).toHaveBeenCalledWith(mockUserId, mockClassId);
    });

    it('should return null if no membership exists for the user and class', async () => {
      mockMembershipService.findByUserAndClass.mockResolvedValueOnce(null);
      const result = await controller.findByUserAndClass('nonexistent-id', mockClassId);
      expect(result).toBeNull();
    });
  });

  describe('deleteByClass', () => {
    it('should delete all memberships for a specific class', async () => {
      await controller.deleteByClass(mockClassId);
      expect(service.deleteByClass).toHaveBeenCalledWith(mockClassId);
    });
  });
}); 