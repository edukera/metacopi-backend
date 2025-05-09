import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { TaskService } from './task.service';
import { Task, TaskStatus } from './task.schema';
import { MembershipService } from '../memberships/membership.service';
import { SubmissionService } from '../submissions/submission.service';
import { MembershipRole } from '../memberships/membership.schema';
import { createTaskDto, taskStub, updateTaskDto } from '../../../test/factories/task.factory';

describe('TaskService', () => {
  let service: TaskService;
  let model: any;
  let membershipService: any;
  let submissionService: any;
  
  const userId = new Types.ObjectId().toString();
  const classId = new Types.ObjectId().toString();
  
  const mockRequest = {
    user: {
      sub: userId,
      role: 'user'
    }
  };

  beforeEach(async () => {
    // Create a mock model with constructor and save
    const mockModel = {
      find: jest.fn().mockReturnThis(),
      findOne: jest.fn().mockReturnThis(),
      findById: jest.fn().mockReturnThis(),
      findByIdAndUpdate: jest.fn().mockReturnThis(),
      findByIdAndDelete: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    // Add a mocked constructor function
    function MockModel(dto) {
      this.data = dto;
      this.save = jest.fn().mockImplementation(() => {
        return Promise.resolve({ _id: new Types.ObjectId(), ...dto });
      });
    }

    // Add static functions to the constructor
    Object.assign(MockModel, mockModel);

    // Create service mocks
    const mockMembershipService = {
      findByUserAndClass: jest.fn(),
      findByUser: jest.fn(),
    };

    const mockSubmissionService = {
      removeByTask: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: getModelToken(Task.name),
          useValue: MockModel,
        },
        {
          provide: MembershipService,
          useValue: mockMembershipService,
        },
        {
          provide: SubmissionService,
          useValue: mockSubmissionService,
        },
        {
          provide: 'REQUEST',
          useValue: mockRequest,
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    model = module.get(getModelToken(Task.name));
    membershipService = module.get<MembershipService>(MembershipService);
    submissionService = module.get<SubmissionService>(SubmissionService);

    // Reset the mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a task when user is a teacher', async () => {
      // Arrange
      const createDto = createTaskDto({ classId });
      const membership = { userId, classId, role: MembershipRole.TEACHER };
      
      membershipService.findByUserAndClass.mockResolvedValue(membership);

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(membershipService.findByUserAndClass).toHaveBeenCalledWith(userId, classId);
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });

    it('should throw BadRequestException when user is not a teacher', async () => {
      // Arrange
      const createDto = createTaskDto({ classId });
      const membership = { userId, classId, role: MembershipRole.STUDENT };
      
      membershipService.findByUserAndClass.mockResolvedValue(membership);

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      expect(membershipService.findByUserAndClass).toHaveBeenCalledWith(userId, classId);
    });

    it('should throw BadRequestException when user is not a member of the class', async () => {
      // Arrange
      const createDto = createTaskDto({ classId });
      
      membershipService.findByUserAndClass.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      expect(membershipService.findByUserAndClass).toHaveBeenCalledWith(userId, classId);
    });
  });

  describe('findAll', () => {
    it('should return all tasks with optional filters', async () => {
      // Arrange
      const tasks = [taskStub(), taskStub()];
      const filters = { status: TaskStatus.PUBLISHED };
      
      model.exec.mockResolvedValue(tasks);

      // Act
      const result = await service.findAll(filters);

      // Assert
      expect(model.find).toHaveBeenCalledWith(filters);
      expect(result).toEqual(tasks);
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      // Arrange
      const task = taskStub();
      const id = task._id.toString();
      
      model.exec.mockResolvedValue(task);

      // Act
      const result = await service.findOne(id);

      // Assert
      expect(model.findById).toHaveBeenCalledWith(id);
      expect(result).toEqual(task);
    });

    it('should throw NotFoundException if task not found', async () => {
      // Arrange
      const id = new Types.ObjectId().toString();
      
      model.exec.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
      expect(model.findById).toHaveBeenCalledWith(id);
    });
  });

  describe('findByClass', () => {
    it('should return tasks by class id', async () => {
      // Arrange
      const tasks = [taskStub(), taskStub()];
      
      model.exec.mockResolvedValue(tasks);

      // Act
      const result = await service.findByClass(classId);

      // Assert
      expect(model.find).toHaveBeenCalledWith({ classId });
      expect(result).toEqual(tasks);
    });
  });

  describe('update', () => {
    it('should update a task when user is a teacher', async () => {
      // Arrange
      const taskClassId = new Types.ObjectId().toString();
      const task = taskStub({ classId: taskClassId });
      const id = task._id.toString();
      const updateDto = updateTaskDto({ title: 'Updated Task' });
      const updatedTask = { ...task, title: 'Updated Task' };
      const membership = { userId, classId: taskClassId, role: MembershipRole.TEACHER };
      
      // First findOne call
      model.exec.mockResolvedValueOnce(task);
      // findByIdAndUpdate call
      model.exec.mockResolvedValueOnce(updatedTask);
      
      membershipService.findByUserAndClass.mockResolvedValue(membership);

      // Act
      const result = await service.update(id, updateDto);

      // Assert
      expect(model.findById).toHaveBeenCalledWith(id);
      expect(membershipService.findByUserAndClass).toHaveBeenCalledWith(userId, taskClassId);
      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(id, updateDto, { new: true });
      expect(result).toEqual(updatedTask);
    });

    it('should throw BadRequestException when user is not a teacher', async () => {
      // Arrange
      const taskClassId = new Types.ObjectId().toString();
      const task = taskStub({ classId: taskClassId });
      const id = task._id.toString();
      const updateDto = updateTaskDto({ title: 'Updated Task' });
      const membership = { userId, classId: taskClassId, role: MembershipRole.STUDENT };
      
      model.exec.mockResolvedValueOnce(task);
      
      membershipService.findByUserAndClass.mockResolvedValue(membership);

      // Act & Assert
      await expect(service.update(id, updateDto)).rejects.toThrow(BadRequestException);
      expect(model.findById).toHaveBeenCalledWith(id);
      expect(membershipService.findByUserAndClass).toHaveBeenCalledWith(userId, taskClassId);
      expect(model.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('archive', () => {
    it('should archive a task when user is a teacher', async () => {
      // Arrange
      const taskClassId = new Types.ObjectId().toString();
      const task = taskStub({ classId: taskClassId });
      const id = task._id.toString();
      const archivedTask = { ...task, status: TaskStatus.ARCHIVED };
      const membership = { userId, classId: taskClassId, role: MembershipRole.TEACHER };
      
      // First findOne call
      model.exec.mockResolvedValueOnce(task);
      // findByIdAndUpdate call
      model.exec.mockResolvedValueOnce(archivedTask);
      
      membershipService.findByUserAndClass.mockResolvedValue(membership);

      // Act
      const result = await service.archive(id);

      // Assert
      expect(model.findById).toHaveBeenCalledWith(id);
      expect(membershipService.findByUserAndClass).toHaveBeenCalledWith(userId, taskClassId);
      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(id, { status: TaskStatus.ARCHIVED }, { new: true });
      expect(result).toEqual(archivedTask);
    });
  });

  describe('publish', () => {
    it('should publish a task when user is a teacher', async () => {
      // Arrange
      const taskClassId = new Types.ObjectId().toString();
      const task = taskStub({ classId: taskClassId, status: TaskStatus.DRAFT });
      const id = task._id.toString();
      const publishedTask = { ...task, status: TaskStatus.PUBLISHED };
      const membership = { userId, classId: taskClassId, role: MembershipRole.TEACHER };
      
      // First findOne call
      model.exec.mockResolvedValueOnce(task);
      // findByIdAndUpdate call
      model.exec.mockResolvedValueOnce(publishedTask);
      
      membershipService.findByUserAndClass.mockResolvedValue(membership);

      // Act
      const result = await service.publish(id);

      // Assert
      expect(model.findById).toHaveBeenCalledWith(id);
      expect(membershipService.findByUserAndClass).toHaveBeenCalledWith(userId, taskClassId);
      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(id, { status: TaskStatus.PUBLISHED }, { new: true });
      expect(result).toEqual(publishedTask);
    });
  });

  describe('remove', () => {
    it('should remove a task and associated submissions when user is a teacher', async () => {
      // Arrange
      const taskClassId = new Types.ObjectId().toString();
      const task = taskStub({ classId: taskClassId });
      const id = task._id.toString();
      const membership = { userId, classId: taskClassId, role: MembershipRole.TEACHER };
      
      // First findOne call
      model.exec.mockResolvedValueOnce(task);
      // findByIdAndDelete call
      model.exec.mockResolvedValueOnce(task);
      
      membershipService.findByUserAndClass.mockResolvedValue(membership);

      // Act
      const result = await service.remove(id);

      // Assert
      expect(model.findById).toHaveBeenCalledWith(id);
      expect(membershipService.findByUserAndClass).toHaveBeenCalledWith(userId, taskClassId);
      expect(submissionService.removeByTask).toHaveBeenCalledWith(id);
      expect(model.findByIdAndDelete).toHaveBeenCalledWith(id);
      expect(result).toEqual(task);
    });
  });

  describe('findTasksForUser', () => {
    it('should return all published tasks for classes the user is a member of', async () => {
      // Arrange
      const classIds = [classId, new Types.ObjectId().toString()];
      const memberships = classIds.map(id => ({ userId, classId: id }));
      const tasks = [taskStub(), taskStub()];
      
      membershipService.findByUser.mockResolvedValue(memberships);
      model.exec.mockResolvedValue(tasks);

      // Act
      const result = await service.findTasksForUser();

      // Assert
      expect(membershipService.findByUser).toHaveBeenCalledWith(userId);
      expect(model.find).toHaveBeenCalledWith({
        classId: { $in: classIds },
        status: TaskStatus.PUBLISHED
      });
      expect(result).toEqual(tasks);
    });
  });
}); 