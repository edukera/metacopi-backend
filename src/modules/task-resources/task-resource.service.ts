import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TaskResource, TaskResourceDocument } from './task-resource.schema';
import { CreateTaskResourceDto, UpdateTaskResourceDto } from './task-resource.dto';
import { TaskService } from '../tasks/task.service';
import { REQUEST } from '@nestjs/core';
import { MembershipService } from '../memberships/membership.service';

@Injectable()
export class TaskResourceService {
  constructor(
    @InjectModel(TaskResource.name)
    private taskResourceModel: Model<TaskResourceDocument>,
    private taskService: TaskService,
    private membershipService: MembershipService,
    @Inject(REQUEST) private request,
  ) {}

  async create(createTaskResourceDto: CreateTaskResourceDto): Promise<TaskResource> {
    const userEmail = this.request.user.email;
    
    // Check if the task exists
    const task = await this.taskService.findOne(createTaskResourceDto.taskId);
    
    // Check if the user is authorized (teacher of the class)
    const membership = await this.membershipService.findByUserAndClass(userEmail, task.classId);
    if (!membership || membership.role !== 'teacher') {
      throw new BadRequestException('You must be a teacher in this class to add resources');
    }
    
    // Calculate the order (last + 1)
    const lastResource = await this.taskResourceModel
      .findOne({ taskId: createTaskResourceDto.taskId })
      .sort({ order: -1 })
      .exec();
    
    const order = lastResource ? lastResource.order + 1 : 0;
    
    const taskResource = new this.taskResourceModel({
      ...createTaskResourceDto,
      order,
    });
    
    return taskResource.save();
  }

  async findAll(): Promise<TaskResource[]> {
    return this.taskResourceModel.find().exec();
  }

  async findOne(id: string): Promise<TaskResource> {
    const resource = await this.taskResourceModel.findById(id).exec();
    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }
    return resource;
  }

  async findByTask(taskId: string): Promise<TaskResource[]> {
    // Check if the task exists
    await this.taskService.findOne(taskId);
    
    // Get resources associated with this task, sorted by order
    return this.taskResourceModel.find({ taskId }).sort({ order: 1 }).exec();
  }

  async update(id: string, updateTaskResourceDto: UpdateTaskResourceDto): Promise<TaskResource> {
    const userEmail = this.request.user.email;
    
    // Check if the resource exists
    const resource = await this.findOne(id);
    
    // Check if the task exists
    const task = await this.taskService.findOne(resource.taskId);
    
    // Check if the user is authorized (teacher of the class)
    const membership = await this.membershipService.findByUserAndClass(userEmail, task.classId);
    if (!membership || membership.role !== 'teacher') {
      throw new BadRequestException('You must be a teacher in this class to modify resources');
    }
    
    // If the task is modified, check if the new task exists
    if (updateTaskResourceDto.taskId && updateTaskResourceDto.taskId !== resource.taskId) {
      await this.taskService.findOne(updateTaskResourceDto.taskId);
    }
    
    const updatedResource = await this.taskResourceModel
      .findByIdAndUpdate(id, updateTaskResourceDto, { new: true })
      .exec();
    
    if (!updatedResource) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }
    
    return updatedResource;
  }

  async remove(id: string): Promise<void> {
    const userEmail = this.request.user.email;
    
    // Check if the resource exists
    const resource = await this.findOne(id);
    
    // Check if the task exists
    const task = await this.taskService.findOne(resource.taskId);
    
    // Check if the user is authorized (teacher of the class)
    const membership = await this.membershipService.findByUserAndClass(userEmail, task.classId);
    if (!membership || membership.role !== 'teacher') {
      throw new BadRequestException('You must be a teacher in this class to delete resources');
    }
    
    const result = await this.taskResourceModel.deleteOne({ _id: id }).exec();
    
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }
    
    // Reorder the remaining resources
    await this.reorderAfterRemoval(resource.taskId, resource.order);
  }

  async reorder(taskId: string, resourceIds: string[]): Promise<TaskResource[]> {
    // Check if the task exists
    await this.taskService.findOne(taskId);
    
    // Check that all provided IDs belong to this task
    const resources = await this.taskResourceModel.find({
      _id: { $in: resourceIds },
      taskId,
    }).exec();
    
    if (resources.length !== resourceIds.length) {
      throw new NotFoundException('Some resources do not exist or do not belong to this task');
    }
    
    // Update the order of each resource
    const updatePromises = resourceIds.map((id, index) => {
      return this.taskResourceModel.findByIdAndUpdate(
        id,
        { order: index },
        { new: true }
      ).exec();
    });
    
    return Promise.all(updatePromises);
  }

  private async reorderAfterRemoval(taskId: string, removedOrder: number): Promise<void> {
    // Update the order of resources after deletion
    await this.taskResourceModel.updateMany(
      { taskId, order: { $gt: removedOrder } },
      { $inc: { order: -1 } }
    ).exec();
  }
} 