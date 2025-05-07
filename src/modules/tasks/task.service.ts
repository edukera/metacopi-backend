import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskStatus } from './task.schema';
import { CreateTaskDto, UpdateTaskDto } from './task.dto';
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

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
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
    
    return task.save();
  }

  async findAll(filters: Record<string, any> = {}): Promise<Task[]> {
    return this.taskModel.find(filters).exec();
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async findByClass(classId: string): Promise<Task[]> {
    return this.taskModel.find({ classId }).exec();
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const userId = this.request.user.sub;
    const task = await this.findOne(id);
    
    // Check if the user is a teacher in this class
    const membership = await this.membershipService.findByUserAndClass(userId, task.classId);
    if (!membership || membership.role !== 'teacher') {
      throw new BadRequestException('You must be a teacher in this class to modify a task');
    }
    
    return this.taskModel
      .findByIdAndUpdate(id, updateTaskDto, { new: true })
      .exec();
  }

  async archive(id: string): Promise<Task> {
    const userId = this.request.user.sub;
    const task = await this.findOne(id);
    
    // Check if the user is a teacher in this class
    const membership = await this.membershipService.findByUserAndClass(userId, task.classId);
    if (!membership || membership.role !== 'teacher') {
      throw new BadRequestException('You must be a teacher in this class to archive a task');
    }
    
    return this.taskModel
      .findByIdAndUpdate(id, { status: TaskStatus.ARCHIVED }, { new: true })
      .exec();
  }

  async publish(id: string): Promise<Task> {
    const userId = this.request.user.sub;
    const task = await this.findOne(id);
    
    // Check if the user is a teacher in this class
    const membership = await this.membershipService.findByUserAndClass(userId, task.classId);
    if (!membership || membership.role !== 'teacher') {
      throw new BadRequestException('You must be a teacher in this class to publish a task');
    }
    
    return this.taskModel
      .findByIdAndUpdate(id, { status: TaskStatus.PUBLISHED }, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Task> {
    const userId = this.request.user.sub;
    const task = await this.findOne(id);
    
    // Check if the user is a teacher in this class
    const membership = await this.membershipService.findByUserAndClass(userId, task.classId);
    if (!membership || membership.role !== 'teacher') {
      throw new BadRequestException('You must be a teacher in this class to delete a task');
    }
    
    // Delete all submissions associated with this task
    await this.submissionService.removeByTask(id);
    
    return this.taskModel.findByIdAndDelete(id).exec();
  }

  // For retrieving tasks related to a user
  async findTasksForUser(): Promise<Task[]> {
    const userId = this.request.user.sub;
    
    // Get the classes of which the user is a member
    const memberships = await this.membershipService.findByUser(userId);
    const classIds = memberships.map(m => m.classId);
    
    // Get all published tasks for these classes
    return this.taskModel.find({
      classId: { $in: classIds },
      status: TaskStatus.PUBLISHED
    }).exec();
  }
} 