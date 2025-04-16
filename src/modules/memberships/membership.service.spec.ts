import { Test, TestingModule } from '@nestjs/testing';
import { MembershipService } from './membership.service';
import { getModelToken } from '@nestjs/mongoose';
import { Membership, MembershipRole, MembershipStatus } from './membership.schema';
import { CreateMembershipDto, UpdateMembershipDto } from './membership.dto';
import { Model } from 'mongoose';
import { NotFoundException } from '@nestjs/common';

const mockMembership = {
  _id: 'membership-id-1',
  userId: 'user-id-1',
  classId: 'class-id-1',
  role: MembershipRole.STUDENT,
  startDate: new Date(),
  endDate: new Date(new Date().getTime() + 3600000),
  status: MembershipStatus.ACTIVE,
  paymentId: 'payment-id-1',
  metadata: { notes: 'test notes' },
};

describe('MembershipService', () => {
  let service: MembershipService;
  let model: any;

  beforeEach(async () => {
    // Create a mock model with constructor and save
    const mockModel = {
      find: jest.fn().mockReturnThis(),
      findOne: jest.fn().mockReturnThis(),
      findById: jest.fn().mockReturnThis(),
      findByIdAndUpdate: jest.fn().mockReturnThis(),
      findByIdAndDelete: jest.fn().mockReturnThis(),
      deleteMany: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    // Add a mocked constructor function
    function MockModel(dto) {
      this.data = dto;
      this.save = jest.fn().mockResolvedValue(mockMembership);
    }

    // Add static functions to the constructor
    Object.assign(MockModel, mockModel);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembershipService,
        {
          provide: getModelToken(Membership.name),
          useValue: MockModel,
        },
      ],
    }).compile();

    service = module.get<MembershipService>(MembershipService);
    model = module.get(getModelToken(Membership.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new membership', async () => {
      const createDto: CreateMembershipDto = {
        userId: 'user-id-1',
        classId: 'class-id-1',
        role: MembershipRole.STUDENT,
        startDate: new Date(),
        endDate: new Date(new Date().getTime() + 3600000),
        status: MembershipStatus.ACTIVE,
        paymentId: 'payment-id-1',
        metadata: { notes: 'test notes' },
      };

      const result = await service.create(createDto);
      
      expect(result).toEqual(mockMembership);
    });
  });

  describe('findAll', () => {
    it('should return an array of memberships', async () => {
      const memberships = [mockMembership];
      model.exec.mockResolvedValue(memberships);

      const result = await service.findAll();
      
      expect(result).toEqual(memberships);
      expect(model.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single membership by id', async () => {
      model.exec.mockResolvedValue(mockMembership);

      const result = await service.findOne('membership-id-1');
      
      expect(result).toEqual(mockMembership);
      expect(model.findById).toHaveBeenCalledWith('membership-id-1');
    });

    it('should return null if no membership found', async () => {
      model.exec.mockResolvedValue(null);

      const result = await service.findOne('nonexistent-id');
      
      expect(result).toBeNull();
    });
  });

  describe('findByUser', () => {
    it('should return memberships for a specific user', async () => {
      const memberships = [mockMembership];
      model.exec.mockResolvedValue(memberships);

      const result = await service.findByUser('user-id-1');
      
      expect(result).toEqual(memberships);
      expect(model.find).toHaveBeenCalledWith({ userId: 'user-id-1' });
    });
  });

  describe('findByClass', () => {
    it('should return memberships for a specific class', async () => {
      const memberships = [mockMembership];
      model.exec.mockResolvedValue(memberships);

      const result = await service.findByClass('class-id-1');
      
      expect(result).toEqual(memberships);
      expect(model.find).toHaveBeenCalledWith({ classId: 'class-id-1' });
    });
  });

  describe('findByUserAndClass', () => {
    it('should return a membership for a specific user and class', async () => {
      model.exec.mockResolvedValue(mockMembership);

      const result = await service.findByUserAndClass('user-id-1', 'class-id-1');
      
      expect(result).toEqual(mockMembership);
      expect(model.findOne).toHaveBeenCalledWith({ 
        userId: 'user-id-1', 
        classId: 'class-id-1' 
      });
    });

    it('should return null if no membership found', async () => {
      model.exec.mockResolvedValue(null);

      const result = await service.findByUserAndClass('user-id-1', 'nonexistent-class');
      
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a membership', async () => {
      const updateDto: UpdateMembershipDto = {
        status: MembershipStatus.REMOVED,
        endDate: new Date(),
      };

      const updatedMembership = { ...mockMembership, ...updateDto };
      model.exec.mockResolvedValue(updatedMembership);

      const result = await service.update('membership-id-1', updateDto);
      
      expect(result).toEqual(updatedMembership);
      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
        'membership-id-1',
        updateDto,
        { new: true }
      );
    });
  });

  describe('remove', () => {
    it('should remove a membership', async () => {
      model.exec.mockResolvedValue(mockMembership);

      const result = await service.remove('membership-id-1');
      
      expect(result).toEqual(mockMembership);
      expect(model.findByIdAndDelete).toHaveBeenCalledWith('membership-id-1');
    });
  });

  describe('deleteByClass', () => {
    it('should delete all memberships for a class', async () => {
      model.exec.mockResolvedValue({ deletedCount: 2 });

      await service.deleteByClass('class-id-1');
      
      expect(model.deleteMany).toHaveBeenCalledWith({ classId: 'class-id-1' });
    });
  });
}); 