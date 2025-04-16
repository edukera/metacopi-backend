import { Test, TestingModule } from '@nestjs/testing';
import { TaskResourceController } from './task-resource.controller';
import { TaskResourceService } from './task-resource.service';
import { CreateTaskResourceDto, UpdateTaskResourceDto } from './task-resource.dto';
import { ResourceType, TaskResource } from './task-resource.schema';
import { NotFoundException } from '@nestjs/common';

const mockTaskResourceService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  findByTask: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  reorder: jest.fn(),
};

describe('TaskResourceController', () => {
  let controller: TaskResourceController;
  let service: TaskResourceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskResourceController],
      providers: [
        {
          provide: TaskResourceService,
          useValue: mockTaskResourceService,
        },
      ],
    }).compile();

    controller = module.get<TaskResourceController>(TaskResourceController);
    service = module.get<TaskResourceService>(TaskResourceService);
    
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of task resources', async () => {
      const result: TaskResource[] = [
        { 
          _id: '1', 
          taskId: 'task1', 
          name: 'Resource 1', 
          type: ResourceType.LINK, 
          content: 'https://example.com', 
          order: 0 
        },
      ] as any;
      
      jest.spyOn(service, 'findAll').mockResolvedValue(result);

      expect(await controller.findAll()).toBe(result);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findByTask', () => {
    it('should return resources for a specific task', async () => {
      const taskId = 'task1';
      const result: TaskResource[] = [
        { 
          _id: '1', 
          taskId, 
          name: 'Resource 1', 
          type: ResourceType.LINK, 
          content: 'https://example.com', 
          order: 0 
        },
      ] as any;
      
      jest.spyOn(service, 'findByTask').mockResolvedValue(result);

      expect(await controller.findByTask(taskId)).toBe(result);
      expect(service.findByTask).toHaveBeenCalledWith(taskId);
    });
  });

  describe('findOne', () => {
    it('should return a single task resource', async () => {
      const id = '1';
      const result: TaskResource = { 
        _id: id, 
        taskId: 'task1', 
        name: 'Resource 1', 
        type: ResourceType.LINK, 
        content: 'https://example.com', 
        order: 0 
      } as any;
      
      jest.spyOn(service, 'findOne').mockResolvedValue(result);

      expect(await controller.findOne(id)).toBe(result);
      expect(service.findOne).toHaveBeenCalledWith(id);
    });

    it('should throw an exception for invalid id', async () => {
      const id = 'invalid';
      
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
      expect(service.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('create', () => {
    it('should create a task resource', async () => {
      const createDto: CreateTaskResourceDto = {
        taskId: 'task1',
        name: 'New Resource',
        type: ResourceType.LINK,
        content: 'https://example.com',
      };
      
      const result: TaskResource = {
        _id: '1',
        ...createDto,
        order: 0,
      } as any;
      
      jest.spyOn(service, 'create').mockResolvedValue(result);

      expect(await controller.create(createDto)).toBe(result);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('update', () => {
    it('should update a task resource', async () => {
      const id = '1';
      const updateDto: UpdateTaskResourceDto = {
        name: 'Updated Resource',
      };
      
      const result: TaskResource = {
        _id: id,
        taskId: 'task1',
        name: 'Updated Resource',
        type: ResourceType.LINK,
        content: 'https://example.com',
        order: 0,
      } as any;
      
      jest.spyOn(service, 'update').mockResolvedValue(result);

      expect(await controller.update(id, updateDto)).toBe(result);
      expect(service.update).toHaveBeenCalledWith(id, updateDto);
    });
  });

  describe('remove', () => {
    it('should remove a task resource', async () => {
      const id = '1';
      
      jest.spyOn(service, 'remove').mockResolvedValue(undefined);

      await controller.remove(id);
      expect(service.remove).toHaveBeenCalledWith(id);
    });
  });

  describe('reorder', () => {
    it('should reorder task resources', async () => {
      const taskId = 'task1';
      const resourceIds = ['id1', 'id2', 'id3'];
      
      const result: TaskResource[] = [
        { _id: 'id1', taskId, order: 0 },
        { _id: 'id2', taskId, order: 1 },
        { _id: 'id3', taskId, order: 2 },
      ] as any[];
      
      jest.spyOn(service, 'reorder').mockResolvedValue(result);

      expect(await controller.reorder(taskId, resourceIds)).toBe(result);
      expect(service.reorder).toHaveBeenCalledWith(taskId, resourceIds);
    });
  });
}); 