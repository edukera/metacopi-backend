import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskStatus } from './task.schema';
import { CreateTaskDto, UpdateTaskDto, TaskResponseDto } from './task.dto';
import { MembershipService } from '../memberships/membership.service';
import { SubmissionService } from '../submissions/submission.service';
import { REQUEST } from '@nestjs/core';

@Injectable()
export class TaskService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<Task>,
    private membershipService: MembershipService,
    @Inject(forwardRef(() => SubmissionService)) private submissionService: SubmissionService,
    @Inject(REQUEST) private request,
  ) {}

  // Convertir un objet Task en TaskResponseDto
  private toResponseDto(task: Task): TaskResponseDto {
    const taskDto = new TaskResponseDto();
    taskDto.id = task._id.toString();
    taskDto.title = task.title;
    taskDto.description = task.description;
    taskDto.classId = task.classId?.toString();
    taskDto.createdBy = task.createdBy?.toString();
    taskDto.status = task.status;
    taskDto.dueDate = task.dueDate;
    taskDto.points = task.points;
    taskDto.tags = task.tags;
    taskDto.metadata = task.metadata;
    taskDto.settings = task.settings;
    // Task étend Document de Mongoose qui inclut ces propriétés grâce à { timestamps: true }
    taskDto.createdAt = (task as any).createdAt;
    taskDto.updatedAt = (task as any).updatedAt;
    return taskDto;
  }

  // Convertir une liste d'objets Task en liste de TaskResponseDto
  private toResponseDtoList(tasks: Task[]): TaskResponseDto[] {
    return tasks.map(task => this.toResponseDto(task));
  }

  async create(createTaskDto: CreateTaskDto): Promise<TaskResponseDto> {
    const userId = this.request.user.sub;
    
    // Check if the user is a teacher in this class
    const membership = await this.membershipService.findByUserAndClass(userId, createTaskDto.classId);
    if (!membership || membership.role !== 'teacher') {
      throw new BadRequestException('You must be a teacher in this class to create a task');
    }
    
    const task = new this.taskModel({
      ...createTaskDto,
      createdBy: userId,
    });
    
    const savedTask = await task.save();
    return this.toResponseDto(savedTask);
  }

  async findAll(filters: Record<string, any> = {}): Promise<TaskResponseDto[]> {
    const tasks = await this.taskModel.find(filters).exec();
    return this.toResponseDtoList(tasks);
  }

  async findOne(id: string): Promise<TaskResponseDto> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return this.toResponseDto(task);
  }

  async findByClass(classId: string): Promise<TaskResponseDto[]> {
    const tasks = await this.taskModel.find({ classId }).exec();
    return this.toResponseDtoList(tasks);
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<TaskResponseDto> {
    const userId = this.request.user.sub;
    const task = await this.findTaskEntity(id);
    
    // Check if the user is a teacher in this class
    const membership = await this.membershipService.findByUserAndClass(userId, task.classId);
    if (!membership || membership.role !== 'teacher') {
      throw new BadRequestException('You must be a teacher in this class to modify a task');
    }
    
    const updatedTask = await this.taskModel
      .findByIdAndUpdate(id, updateTaskDto, { new: true })
      .exec();
    
    return this.toResponseDto(updatedTask);
  }

  async archive(id: string): Promise<TaskResponseDto> {
    const userId = this.request.user.sub;
    const task = await this.findTaskEntity(id);
    
    // Check if the user is a teacher in this class
    const membership = await this.membershipService.findByUserAndClass(userId, task.classId);
    if (!membership || membership.role !== 'teacher') {
      throw new BadRequestException('You must be a teacher in this class to archive a task');
    }
    
    const updatedTask = await this.taskModel
      .findByIdAndUpdate(id, { status: TaskStatus.ARCHIVED }, { new: true })
      .exec();
    
    return this.toResponseDto(updatedTask);
  }

  async publish(id: string): Promise<TaskResponseDto> {
    const userId = this.request.user.sub;
    const task = await this.findTaskEntity(id);
    
    // Check if the user is a teacher in this class
    const membership = await this.membershipService.findByUserAndClass(userId, task.classId);
    if (!membership || membership.role !== 'teacher') {
      throw new BadRequestException('You must be a teacher in this class to publish a task');
    }
    
    const updatedTask = await this.taskModel
      .findByIdAndUpdate(id, { status: TaskStatus.PUBLISHED }, { new: true })
      .exec();
    
    return this.toResponseDto(updatedTask);
  }

  async remove(id: string): Promise<void> {
    const userId = this.request.user.sub;
    const task = await this.findTaskEntity(id);
    
    // Check if the user is a teacher in this class
    const membership = await this.membershipService.findByUserAndClass(userId, task.classId);
    if (!membership || membership.role !== 'teacher') {
      throw new BadRequestException('You must be a teacher in this class to delete a task');
    }
    
    // Delete all submissions associated with this task
    await this.submissionService.removeByTask(id);
    
    await this.taskModel.findByIdAndDelete(id).exec();
  }

  // Pour l'utilisation interne uniquement - récupère l'entité Task sans la convertir en DTO
  private async findTaskEntity(id: string): Promise<Task> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  // For retrieving tasks related to a user
  async findTasksForUser(): Promise<TaskResponseDto[]> {
    const userId = this.request.user.sub;
    
    // Get the classes of which the user is a member
    const memberships = await this.membershipService.findByUser(userId);
    const classIds = memberships.map(m => m.classId);
    
    // Get all published tasks for these classes
    const tasks = await this.taskModel.find({
      classId: { $in: classIds },
      status: TaskStatus.PUBLISHED
    }).exec();
    
    return this.toResponseDtoList(tasks);
  }
} 