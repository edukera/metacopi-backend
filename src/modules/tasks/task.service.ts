import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskStatus } from './task.schema';
import { CreateTaskDto, UpdateTaskDto, TaskResponseDto, TaskWithStatsResponseDto } from './task.dto';
import { MembershipService } from '../memberships/membership.service';
import { SubmissionService } from '../submissions/submission.service';
import { Submission } from '../submissions/submission.schema';
import { Correction } from '../corrections/correction.schema';
import { REQUEST } from '@nestjs/core';

@Injectable()
export class TaskService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(Submission.name) private submissionModel: Model<Submission>,
    @InjectModel(Correction.name) private correctionModel: Model<Correction>,
    private membershipService: MembershipService,
    @Inject(forwardRef(() => SubmissionService)) private submissionService: SubmissionService,
    @Inject(REQUEST) private request,
  ) {}

  // Convertir un objet Task en TaskResponseDto
  private toResponseDto(task: Task): TaskResponseDto {
    const taskDto = new TaskResponseDto();
    taskDto.id = task.id;
    taskDto.title = task.title;
    taskDto.description = task.description;
    taskDto.classId = task.classId;
    taskDto.createdByEmail = task.createdByEmail;
    taskDto.status = task.status;
    taskDto.dueDate = task.dueDate;
    taskDto.points = task.points;
    taskDto.utterance = task.utterance;
    taskDto.tags = task.tags;
    taskDto.metadata = task.metadata;
    taskDto.settings = task.settings;
    taskDto.createdAt = (task as any).createdAt;
    taskDto.updatedAt = (task as any).updatedAt;
    return taskDto;
  }

  // Convertir une liste d'objets Task en liste de TaskResponseDto
  private toResponseDtoList(tasks: Task[]): TaskResponseDto[] {
    return tasks.map(task => this.toResponseDto(task));
  }

  async create(createTaskDto: CreateTaskDto): Promise<TaskResponseDto> {
    const email = this.request.user.email;
    
    // Check if the user is a teacher in this class
    const membership = await this.membershipService.findByUserAndClass(email, createTaskDto.classId);
    if (!membership || membership.role !== 'teacher') {
      throw new BadRequestException('You must be a teacher in this class to create a task');
    }
    
    const task = new this.taskModel({
      ...createTaskDto,
      createdByEmail: email,
    });
    
    const savedTask = await task.save();
    return this.toResponseDto(savedTask);
  }

  async findAll(filters: Record<string, any> = {}): Promise<TaskResponseDto[]> {
    const tasks = await this.taskModel.find(filters).exec();
    return this.toResponseDtoList(tasks);
  }

  async findOne(id: string): Promise<TaskResponseDto> {
    // Recherche d'abord par id logique, puis par _id MongoDB si non trouvé
    let task = await this.taskModel.findOne({ id }).exec();
    if (!task) {
      task = await this.taskModel.findById(id).exec();
    }
    if (!task) {
      throw new NotFoundException(`Task with logical ID or MongoDB ID '${id}' not found`);
    }
    return this.toResponseDto(task);
  }

  async findByClass(classId: string): Promise<TaskResponseDto[]> {
    const tasks = await this.taskModel.find({ classId }).exec();
    return this.toResponseDtoList(tasks);
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<TaskResponseDto> {
    const email = this.request.user.email;
    // Recherche d'abord par id logique, puis par _id MongoDB si non trouvé
    let task = await this.taskModel.findOne({ id }).exec();
    if (!task) {
      task = await this.taskModel.findById(id).exec();
    }
    if (!task) {
      throw new NotFoundException(`Task with logical ID or MongoDB ID '${id}' not found`);
    }
    // Check if the user is a teacher in this class
    const membership = await this.membershipService.findByUserAndClass(email, task.classId);
    if (!membership || membership.role !== 'teacher') {
      throw new BadRequestException('You must be a teacher in this class to modify a task');
    }
    const updatedTask = await this.taskModel.findByIdAndUpdate(task._id, updateTaskDto, { new: true }).exec();
    return this.toResponseDto(updatedTask);
  }

  async archive(id: string): Promise<TaskResponseDto> {
    const email = this.request.user.email;
    // Recherche d'abord par id logique, puis par _id MongoDB si non trouvé
    let task = await this.taskModel.findOne({ id }).exec();
    if (!task) {
      task = await this.taskModel.findById(id).exec();
    }
    if (!task) {
      throw new NotFoundException(`Task with logical ID or MongoDB ID '${id}' not found`);
    }
    // Check if the user is a teacher in this class
    const membership = await this.membershipService.findByUserAndClass(email, task.classId);
    if (!membership || membership.role !== 'teacher') {
      throw new BadRequestException('You must be a teacher in this class to archive a task');
    }
    const updatedTask = await this.taskModel.findByIdAndUpdate(task._id, { status: TaskStatus.ARCHIVED }, { new: true }).exec();
    return this.toResponseDto(updatedTask);
  }

  async publish(id: string): Promise<TaskResponseDto> {
    const email = this.request.user.email;
    // Recherche d'abord par id logique, puis par _id MongoDB si non trouvé
    let task = await this.taskModel.findOne({ id }).exec();
    if (!task) {
      task = await this.taskModel.findById(id).exec();
    }
    if (!task) {
      throw new NotFoundException(`Task with logical ID or MongoDB ID '${id}' not found`);
    }
    // Check if the user is a teacher in this class
    const membership = await this.membershipService.findByUserAndClass(email, task.classId);
    if (!membership || membership.role !== 'teacher') {
      throw new BadRequestException('You must be a teacher in this class to publish a task');
    }
    const updatedTask = await this.taskModel.findByIdAndUpdate(task._id, { status: TaskStatus.PUBLISHED }, { new: true }).exec();
    return this.toResponseDto(updatedTask);
  }

  async remove(id: string): Promise<void> {
    const email = this.request.user.email;
    // Recherche d'abord par id logique, puis par _id MongoDB si non trouvé
    let task = await this.taskModel.findOne({ id }).exec();
    if (!task) {
      task = await this.taskModel.findById(id).exec();
    }
    if (!task) {
      throw new NotFoundException(`Task with logical ID or MongoDB ID '${id}' not found`);
    }
    // Check if the user is a teacher in this class
    const membership = await this.membershipService.findByUserAndClass(email, task.classId);
    if (!membership || membership.role !== 'teacher') {
      throw new BadRequestException('You must be a teacher in this class to delete a task');
    }
    // Delete all submissions associated with this task
    await this.submissionService.removeByTask(task._id.toString());
    await this.taskModel.findByIdAndDelete(task._id).exec();
  }

  // Pour l'utilisation interne uniquement - récupère l'entité Task sans la convertir en DTO
  private async findTaskEntity(id: string): Promise<Task> {
    // Recherche d'abord par id logique, puis par _id MongoDB si non trouvé
    let task = await this.taskModel.findOne({ id }).exec();
    if (!task) {
      task = await this.taskModel.findById(id).exec();
    }
    if (!task) {
      throw new NotFoundException(`Task with logical ID or MongoDB ID '${id}' not found`);
    }
    return task;
  }

  // For retrieving tasks related to a user
  async findTasksForUser(): Promise<TaskResponseDto[]> {
    const email = this.request.user.email;
    
    // Get the classes of which the user is a member
    const memberships = await this.membershipService.findByUserEmail(email);
    const classIds = memberships.map(m => m.classId);
    
    // Get all published tasks for these classes
    const tasks = await this.taskModel.find({
      classId: { $in: classIds },
      status: TaskStatus.PUBLISHED
    }).exec();
    
    return this.toResponseDtoList(tasks);
  }

  // Nouvelle méthode pour récupérer les tâches avec statistiques
  async findByClassWithStats(classId: string): Promise<TaskWithStatsResponseDto[]> {
    // 1. Récupérer les tâches de la classe
    const tasks = await this.taskModel.find({ classId }).exec();

    if (tasks.length === 0) {
      return [];
    }

    // 2. Utiliser l'agrégation MongoDB pour calculer les statistiques efficacement
    const statsAggregation = await this.submissionModel.aggregate([
      {
        $match: {
          taskId: { $in: tasks.map(task => task.id) }
        }
      },
      {
        $lookup: {
          from: 'corrections', // nom de la collection corrections
          localField: 'id', // submission.id
          foreignField: 'submissionId', // correction.submissionId
          as: 'correction'
        }
      },
      {
        $group: {
          _id: '$taskId',
          submissionCount: { $sum: 1 },
          correctedCount: {
            $sum: {
              $cond: [
                { $gt: [{ $size: '$correction' }, 0] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // 3. Créer un map des statistiques pour un accès rapide
    const statsMap = new Map();
    statsAggregation.forEach(stat => {
      statsMap.set(stat._id, {
        submissionCount: stat.submissionCount,
        correctedCount: stat.correctedCount
      });
    });

    // 4. Combiner les tâches avec leurs statistiques
    return tasks.map(task => {
      const baseDto = this.toResponseDto(task);
      const stats = statsMap.get(task.id) || {
        submissionCount: 0,
        correctedCount: 0
      };

      return {
        ...baseDto,
        ...stats
      } as TaskWithStatsResponseDto;
    });
  }
} 