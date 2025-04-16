import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TaskResourceService } from './task-resource.service';
import { TaskResource, ResourceType } from './task-resource.schema';
import { TaskService } from '../tasks/task.service';
import { MembershipService } from '../memberships/membership.service';
import { REQUEST } from '@nestjs/core';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { CreateTaskResourceDto, UpdateTaskResourceDto } from './task-resource.dto';

const mockRequest = {
  user: {
    sub: 'user-id-123',
  },
};

describe('TaskResourceService', () => {
  let service: TaskResourceService;
  let model: any;
  let taskService: any;
  let membershipService: any;

  beforeEach(async () => {
    // Create a mock Mongoose Resource with constructor
    const mockTaskResource = {
      _id: 'resource-id-123',
      name: 'Test Resource',
      taskId: 'task-id-123',
      order: 0,
      save: jest.fn().mockResolvedValue({
        _id: 'resource-id-123',
        name: 'Test Resource',
        taskId: 'task-id-123',
        order: 0
      })
    };
    
    // Configure all necessary mocks
    const mockTaskResourceModel = function() {
      return mockTaskResource;
    };
    
    // Add model methods
    mockTaskResourceModel.find = jest.fn().mockReturnThis();
    mockTaskResourceModel.findOne = jest.fn().mockReturnThis();
    mockTaskResourceModel.findById = jest.fn().mockReturnThis();
    mockTaskResourceModel.findByIdAndUpdate = jest.fn().mockReturnThis();
    mockTaskResourceModel.deleteOne = jest.fn().mockReturnThis();
    mockTaskResourceModel.updateMany = jest.fn().mockReturnThis();
    mockTaskResourceModel.sort = jest.fn().mockReturnThis();
    mockTaskResourceModel.exec = jest.fn();

    const mockTaskSvc = {
      findOne: jest.fn()
    };

    const mockMembershipSvc = {
      findByUserAndClass: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskResourceService,
        {
          provide: getModelToken(TaskResource.name),
          useValue: mockTaskResourceModel,
        },
        {
          provide: TaskService,
          useValue: mockTaskSvc,
        },
        {
          provide: MembershipService,
          useValue: mockMembershipSvc,
        },
        {
          provide: REQUEST,
          useValue: mockRequest,
        },
      ],
    }).compile();

    service = module.get<TaskResourceService>(TaskResourceService);
    model = module.get(getModelToken(TaskResource.name));
    taskService = module.get<TaskService>(TaskService);
    membershipService = module.get<MembershipService>(MembershipService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new task resource', async () => {
      // Prepare test data
      const createDto: CreateTaskResourceDto = {
        name: 'Test Resource',
        description: 'Test Description',
        taskId: 'task-id-123',
        type: ResourceType.FILE,
        filePath: '/path/to/file',
        mimeType: 'application/pdf',
        fileSize: 1024,
        isRequired: true,
      };

      const task = { id: 'task-id-123', classId: 'class-id-123' };
      const membership = { id: 'membership-id-123', role: 'teacher' };
      
      // Configure the mocks
      model.findOne.mockImplementation(() => ({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      }));
      
      taskService.findOne.mockResolvedValue(task);
      membershipService.findByUserAndClass.mockResolvedValue(membership);
      
      // Execute the test
      const result = await service.create(createDto);
      
      // Verify the results
      expect(taskService.findOne).toHaveBeenCalledWith(createDto.taskId);
      expect(membershipService.findByUserAndClass).toHaveBeenCalledWith(
        mockRequest.user.sub,
        task.classId
      );
      expect(result).toBeDefined();
      expect(result._id).toBe('resource-id-123');
    });

    it('should throw BadRequestException if user is not a teacher', async () => {
      const createDto: CreateTaskResourceDto = {
        name: 'Test Resource',
        taskId: 'task-id-123',
        type: ResourceType.FILE,
      };

      const task = { id: 'task-id-123', classId: 'class-id-123' };
      const membership = { id: 'membership-id-123', role: 'student' };

      taskService.findOne.mockResolvedValue(task);
      membershipService.findByUserAndClass.mockResolvedValue(membership);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all task resources', async () => {
      const resources = [
        { id: '1', name: 'Resource 1' },
        { id: '2', name: 'Resource 2' },
      ];
      
      model.find.mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(resources),
      }));

      const result = await service.findAll();
      
      expect(model.find).toHaveBeenCalled();
      expect(result).toEqual(resources);
    });
  });

  describe('findOne', () => {
    it('should return a task resource by id', async () => {
      const resource = { id: 'resource-id-123', name: 'Resource 1' };
      
      model.findById.mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(resource),
      }));

      const result = await service.findOne('resource-id-123');
      
      expect(model.findById).toHaveBeenCalledWith('resource-id-123');
      expect(result).toEqual(resource);
    });

    it('should throw NotFoundException if resource not found', async () => {
      model.findById.mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(null),
      }));

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByTask', () => {
    it('should return resources for a specific task', async () => {
      const taskId = 'task-id-123';
      const resources = [
        { id: '1', name: 'Resource 1', taskId },
        { id: '2', name: 'Resource 2', taskId },
      ];
      
      taskService.findOne.mockResolvedValue({ id: taskId });
      
      model.find.mockImplementation(() => ({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(resources),
      }));

      const result = await service.findByTask(taskId);
      
      expect(taskService.findOne).toHaveBeenCalledWith(taskId);
      expect(model.find).toHaveBeenCalledWith({ taskId });
      expect(result).toEqual(resources);
    });
  });

  describe('update', () => {
    it('should update a task resource', async () => {
      const resourceId = 'resource-id-123';
      const taskId = 'task-id-123';
      const classId = 'class-id-123';
      
      const updateDto: UpdateTaskResourceDto = {
        name: 'Updated Resource',
      };
      
      const existingResource = { 
        id: resourceId, 
        taskId,
        name: 'Original Name' 
      };
      
      const task = { id: taskId, classId };
      const membership = { id: 'membership-id-123', role: 'teacher' };
      const updatedResource = { ...existingResource, ...updateDto };
      
      // Mock the service to return a specific resource
      jest.spyOn(service, 'findOne').mockResolvedValue(existingResource as any);
      
      // Configure the mocks for the services
      taskService.findOne.mockResolvedValue(task);
      membershipService.findByUserAndClass.mockResolvedValue(membership);
      
      // Mock for the update
      model.findByIdAndUpdate.mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(updatedResource),
      }));

      const result = await service.update(resourceId, updateDto);
      
      expect(taskService.findOne).toHaveBeenCalledWith(taskId);
      expect(membershipService.findByUserAndClass).toHaveBeenCalledWith(
        mockRequest.user.sub,
        classId,
      );
      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
        resourceId,
        updateDto,
        { new: true },
      );
      expect(result).toEqual(updatedResource);
    });

    it('should throw BadRequestException if user is not a teacher', async () => {
      const resourceId = 'resource-id-123';
      const taskId = 'task-id-123';
      const classId = 'class-id-123';
      
      const updateDto: UpdateTaskResourceDto = {
        name: 'Updated Resource',
      };
      
      const existingResource = { 
        id: resourceId, 
        taskId,
        name: 'Original Name' 
      };
      
      const task = { id: taskId, classId };
      const membership = { id: 'membership-id-123', role: 'student' };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(existingResource as any);
      taskService.findOne.mockResolvedValue(task);
      membershipService.findByUserAndClass.mockResolvedValue(membership);

      await expect(service.update(resourceId, updateDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should remove a task resource', async () => {
      const resourceId = 'resource-id-123';
      const taskId = 'task-id-123';
      const classId = 'class-id-123';
      const order = 2;
      
      const existingResource = { 
        id: resourceId, 
        taskId,
        order,
        name: 'Resource Name' 
      };
      
      const task = { id: taskId, classId };
      const membership = { id: 'membership-id-123', role: 'teacher' };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(existingResource as any);
      taskService.findOne.mockResolvedValue(task);
      membershipService.findByUserAndClass.mockResolvedValue(membership);
      
      model.deleteOne.mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      }));
      
      model.updateMany.mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue({}),
      }));

      await service.remove(resourceId);
      
      expect(taskService.findOne).toHaveBeenCalledWith(taskId);
      expect(membershipService.findByUserAndClass).toHaveBeenCalledWith(
        mockRequest.user.sub,
        classId,
      );
      expect(model.deleteOne).toHaveBeenCalledWith({ _id: resourceId });
      expect(model.updateMany).toHaveBeenCalledWith(
        { taskId, order: { $gt: order } },
        { $inc: { order: -1 } },
      );
    });

    it('should throw NotFoundException if resource not found on delete', async () => {
      const resourceId = 'resource-id-123';
      const taskId = 'task-id-123';
      const classId = 'class-id-123';
      const order = 2;
      
      const existingResource = { 
        id: resourceId, 
        taskId,
        order,
        name: 'Resource Name' 
      };
      
      const task = { id: taskId, classId };
      const membership = { id: 'membership-id-123', role: 'teacher' };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(existingResource as any);
      taskService.findOne.mockResolvedValue(task);
      membershipService.findByUserAndClass.mockResolvedValue(membership);
      
      model.deleteOne.mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue({ deletedCount: 0 }),
      }));

      await expect(service.remove(resourceId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('reorder', () => {
    it('should reorder resources for a task', async () => {
      const taskId = 'task-id-123';
      const resourceIds = ['resource-1', 'resource-2', 'resource-3'];
      const resources = [
        { id: 'resource-1', taskId },
        { id: 'resource-2', taskId },
        { id: 'resource-3', taskId },
      ];
      const updatedResources = [
        { id: 'resource-1', taskId, order: 0 },
        { id: 'resource-2', taskId, order: 1 },
        { id: 'resource-3', taskId, order: 2 },
      ];
      
      taskService.findOne.mockResolvedValue({ id: taskId });
      
      model.find.mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(resources),
      }));
      
      model.findByIdAndUpdate
        .mockImplementationOnce(() => ({ exec: jest.fn().mockResolvedValue(updatedResources[0]) }))
        .mockImplementationOnce(() => ({ exec: jest.fn().mockResolvedValue(updatedResources[1]) }))
        .mockImplementationOnce(() => ({ exec: jest.fn().mockResolvedValue(updatedResources[2]) }));

      const result = await service.reorder(taskId, resourceIds);
      
      expect(taskService.findOne).toHaveBeenCalledWith(taskId);
      expect(model.find).toHaveBeenCalledWith({
        _id: { $in: resourceIds },
        taskId,
      });
      
      expect(model.findByIdAndUpdate).toHaveBeenCalledTimes(3);
      expect(result).toEqual(updatedResources);
    });

    it('should throw NotFoundException if resource IDs do not match task', async () => {
      const taskId = 'task-id-123';
      const resourceIds = ['resource-1', 'resource-2', 'resource-3'];
      const resources = [
        { id: 'resource-1', taskId },
        { id: 'resource-2', taskId },
      ];
      
      taskService.findOne.mockResolvedValue({ id: taskId });
      
      model.find.mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(resources),
      }));

      await expect(service.reorder(taskId, resourceIds)).rejects.toThrow(NotFoundException);
    });
  });
}); 