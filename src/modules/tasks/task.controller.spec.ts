import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto } from './task.dto';
import { NotFoundException } from '@nestjs/common';
import { Task, TaskStatus } from './task.schema';
import mongoose from 'mongoose';

describe('TaskController', () => {
  let controller: TaskController;
  let service: TaskService;

  const mockTaskId = new mongoose.Types.ObjectId().toString();
  const mockClassId = new mongoose.Types.ObjectId().toString();
  const mockUserId = new mongoose.Types.ObjectId().toString();

  const mockTask = {
    _id: mockTaskId,
    title: 'Test Task',
    description: 'Test Description',
    classId: mockClassId,
    createdBy: mockUserId,
    dueDate: new Date(),
    status: TaskStatus.DRAFT,
    points: 0,
    utterance: 'Test utterance',
    tags: [],
    metadata: {},
    settings: {},
    toJSON: function() {
      return this;
    }
  } as unknown as Task;

  const mockTasks = [
    mockTask,
    {
      _id: new mongoose.Types.ObjectId().toString(),
      title: 'Another Task',
      description: 'Another Description',
      classId: mockClassId,
      createdBy: mockUserId,
      dueDate: new Date(),
      status: TaskStatus.PUBLISHED,
      points: 0,
      utterance: 'Another test utterance',
      tags: [],
      metadata: {},
      settings: {},
      toJSON: function() {
        return this;
      }
    } as unknown as Task
  ];

  // Mock TaskService
  const mockTaskService = {
    findAll: jest.fn().mockResolvedValue(mockTasks),
    findByClass: jest.fn().mockImplementation((classId: string) => {
      return Promise.resolve(mockTasks.filter(t => t.classId === classId));
    }),
    findTasksForUser: jest.fn().mockResolvedValue(mockTasks),
    findOne: jest.fn().mockImplementation((id: string) => {
      const task = mockTasks.find(t => t._id.toString() === id);
      if (!task) {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }
      return Promise.resolve(task);
    }),
    create: jest.fn().mockImplementation((dto: CreateTaskDto) => {
      const newTask = {
        _id: new mongoose.Types.ObjectId().toString(),
        ...dto,
        createdBy: mockUserId,
        status: TaskStatus.DRAFT,
        points: 0,
        tags: [],
        metadata: {},
        settings: {},
        toJSON: function() {
          return this;
        }
      } as unknown as Task;
      return Promise.resolve(newTask);
    }),
    update: jest.fn().mockImplementation((id: string, dto: UpdateTaskDto) => {
      const taskIndex = mockTasks.findIndex(t => t._id.toString() === id);
      if (taskIndex === -1) {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }
      const updatedTask = { ...mockTasks[taskIndex], ...dto };
      return Promise.resolve(updatedTask as unknown as Task);
    }),
    remove: jest.fn().mockImplementation((id: string) => {
      const taskIndex = mockTasks.findIndex(t => t._id.toString() === id);
      if (taskIndex === -1) {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }
      return Promise.resolve();
    }),
    archive: jest.fn().mockImplementation((id: string) => {
      const taskIndex = mockTasks.findIndex(t => t._id.toString() === id);
      if (taskIndex === -1) {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }
      const archivedTask = { 
        ...mockTasks[taskIndex], 
        status: TaskStatus.ARCHIVED 
      } as unknown as Task;
      return Promise.resolve(archivedTask);
    }),
    publish: jest.fn().mockImplementation((id: string) => {
      const taskIndex = mockTasks.findIndex(t => t._id.toString() === id);
      if (taskIndex === -1) {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }
      const publishedTask = { 
        ...mockTasks[taskIndex], 
        status: TaskStatus.PUBLISHED 
      } as unknown as Task;
      return Promise.resolve(publishedTask);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        {
          provide: TaskService,
          useValue: mockTaskService,
        },
      ],
    }).compile();

    controller = module.get<TaskController>(TaskController);
    service = module.get<TaskService>(TaskService);

    // Reset mock counters
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of tasks', async () => {
      const result = await controller.findAll();
      expect(result).toEqual(mockTasks);
      expect(service.findAll).toHaveBeenCalled();
    });

    it('should return tasks filtered by classId when provided', async () => {
      const result = await controller.findAll(mockClassId);
      expect(result).toEqual(mockTasks);
      expect(service.findByClass).toHaveBeenCalledWith(mockClassId);
    });
  });

  describe('findMyTasks', () => {
    it('should return tasks for the current user', async () => {
      const result = await controller.findMyTasks();
      expect(result).toEqual(mockTasks);
      expect(service.findTasksForUser).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single task', async () => {
      const result = await controller.findOne(mockTaskId);
      expect(result).toEqual(mockTask);
      expect(service.findOne).toHaveBeenCalledWith(mockTaskId);
    });

    it('should throw NotFoundException if task not found', async () => {
      await expect(controller.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const createTaskDto: CreateTaskDto = {
        id: mockTaskId,
        title: 'New Task',
        description: 'New Description',
        classId: mockClassId,
        createdByEmail: mockUserId,
        dueDate: new Date(),
        utterance: 'Test utterance for new task',
      };

      const result = await controller.create(createTaskDto);
      expect(result).toHaveProperty('_id');
      expect(result.title).toEqual(createTaskDto.title);
      expect(result.description).toEqual(createTaskDto.description);
      expect(service.create).toHaveBeenCalledWith(createTaskDto);
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated Task',
        description: 'Updated Description',
      };

      const result = await controller.update(mockTaskId, updateTaskDto);
      expect(result.title).toEqual(updateTaskDto.title);
      expect(result.description).toEqual(updateTaskDto.description);
      expect(service.update).toHaveBeenCalledWith(mockTaskId, updateTaskDto);
    });

    it('should throw NotFoundException if task to update not found', async () => {
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated Task',
      };

      await expect(controller.update('nonexistent-id', updateTaskDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      await controller.remove(mockTaskId);
      expect(service.remove).toHaveBeenCalledWith(mockTaskId);
    });

    it('should throw NotFoundException if task to delete not found', async () => {
      mockTaskService.remove.mockRejectedValueOnce(new NotFoundException('Task not found'));
      await expect(controller.remove('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('archive', () => {
    it('should archive a task', async () => {
      const result = await controller.archive(mockTaskId);
      expect(result.status).toBe(TaskStatus.ARCHIVED);
      expect(service.archive).toHaveBeenCalledWith(mockTaskId);
    });

    it('should throw NotFoundException if task to archive not found', async () => {
      mockTaskService.archive.mockRejectedValueOnce(new NotFoundException('Task not found'));
      await expect(controller.archive('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('publish', () => {
    it('should publish a task', async () => {
      const result = await controller.publish(mockTaskId);
      expect(result.status).toBe(TaskStatus.PUBLISHED);
      expect(service.publish).toHaveBeenCalledWith(mockTaskId);
    });

    it('should throw NotFoundException if task to publish not found', async () => {
      mockTaskService.publish.mockRejectedValueOnce(new NotFoundException('Task not found'));
      await expect(controller.publish('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });
}); 