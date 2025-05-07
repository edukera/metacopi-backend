import { Injectable, NotFoundException, BadRequestException, Inject, Logger, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { Submission, SubmissionStatus } from './submission.schema';
import { CreateSubmissionDto, UpdateSubmissionDto } from './submission.dto';
import { CorrectionService } from '../corrections/correction.service';
import { TaskService } from '../tasks/task.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class SubmissionService {
  private readonly logger = new Logger(SubmissionService.name);

  constructor(
    @InjectModel(Submission.name) private submissionModel: Model<Submission>,
    private correctionService: CorrectionService,
    @Inject(forwardRef(() => TaskService)) private taskService: TaskService,
    @Inject(REQUEST) private request,
    private readonly storageService: StorageService,
  ) {}

  async create(createSubmissionDto: CreateSubmissionDto): Promise<Submission> {
    // Si studentId n'est pas fourni, utiliser l'utilisateur actuel
    if (!createSubmissionDto.studentId) {
      createSubmissionDto.studentId = this.request.user.sub;
    }

    // Always set uploadedBy to the current user
    const uploadedBy = this.request.user.sub;

    // Check if a submission already exists for this student and task
    const existingSubmission = await this.submissionModel.findOne({
      studentId: createSubmissionDto.studentId,
      taskId: createSubmissionDto.taskId,
    });

    if (existingSubmission) {
      throw new BadRequestException(
        'A submission already exists for this student and task',
      );
    }

    const newSubmission = new this.submissionModel({
      ...createSubmissionDto,
      uploadedBy,
    });
    return newSubmission.save();
  }

  async findAll(): Promise<Submission[]> {
    return this.submissionModel.find().exec();
  }

  async findOne(id: string): Promise<Submission> {
    const submission = await this.submissionModel.findById(id).exec();
    if (!submission) {
      throw new NotFoundException(`Submission with ID ${id} not found`);
    }
    return submission;
  }

  async findByTask(taskId: string): Promise<Submission[]> {
    return this.submissionModel.find({ taskId }).exec();
  }

  async findByStudent(studentId: string): Promise<Submission[]> {
    return this.submissionModel.find({ studentId }).exec();
  }

  async findByStudentAndTask(
    studentId: string,
    taskId: string,
  ): Promise<Submission> {
    const submission = await this.submissionModel
      .findOne({ studentId, taskId })
      .exec();
    if (!submission) {
      throw new NotFoundException(
        `Submission for student ${studentId} and task ${taskId} not found`,
      );
    }
    return submission;
  }

  async update(
    id: string,
    updateSubmissionDto: UpdateSubmissionDto,
  ): Promise<Submission> {
    const submission = await this.findOne(id);
    
    // Check if a status change to 'submitted' is requested
    if (updateSubmissionDto.status === SubmissionStatus.SUBMITTED && 
        submission.status !== SubmissionStatus.SUBMITTED) {
      updateSubmissionDto.submittedAt = new Date();
    }
    
    // Check if a status change to 'corrected' is requested
    if (updateSubmissionDto.status === SubmissionStatus.CORRECTED && 
        submission.status !== SubmissionStatus.CORRECTED) {
      updateSubmissionDto.reviewedAt = new Date();
    }
    
    const updatedSubmission = await this.submissionModel
      .findByIdAndUpdate(id, updateSubmissionDto, { new: true })
      .exec();
      
    if (!updatedSubmission) {
      throw new NotFoundException(`Submission with ID ${id} not found`);
    }
    
    return updatedSubmission;
  }

  async remove(id: string): Promise<Submission> {
    const submission = await this.findOne(id);
    
    // Delete corrections associated with this submission
    try {
      await this.correctionService.removeBySubmission(id);
    } catch (error) {
      // If there's no correction, continue
      if (!(error instanceof NotFoundException)) {
        throw error;
      }
    }
    
    const deletedSubmission = await this.submissionModel
      .findByIdAndDelete(id)
      .exec();
    if (!deletedSubmission) {
      throw new NotFoundException(`Submission with ID ${id} not found`);
    }
    return deletedSubmission;
  }

  async removeByTask(taskId: string): Promise<void> {
    // Get all submissions for this task
    const submissions = await this.findByTask(taskId);
    
    // Delete corrections for each submission
    for (const submission of submissions) {
      try {
        // Use the string conversion for the Mongoose document ID
        await this.correctionService.removeBySubmission(submission['_id'].toString());
      } catch (error) {
        // If there's no correction, continue
        if (!(error instanceof NotFoundException)) {
          throw error;
        }
      }
    }
    
    // Delete the submissions
    await this.submissionModel.deleteMany({ taskId }).exec();
  }

  /**
   * Trouve toutes les soumissions pour une classe spécifique
   * @param classId ID de la classe
   * @returns Liste des soumissions pour la classe
   */
  async findByClass(classId: string): Promise<Submission[]> {
    this.logger.debug(`Finding submissions for class: ${classId}`);
    
    try {
      // 1. Trouver toutes les tâches de cette classe
      const tasks = await this.taskService.findByClass(classId);
      
      if (!tasks || tasks.length === 0) {
        this.logger.debug(`No tasks found for class ${classId}`);
        return [];
      }
      
      // 2. Extraire les IDs des tâches
      const taskIds = tasks.map(task => task._id.toString());
      this.logger.debug(`Found ${taskIds.length} tasks for class ${classId}`);
      
      // 3. Trouver toutes les soumissions pour ces tâches
      return this.submissionModel.find({
        taskId: { $in: taskIds }
      }).exec();
    } catch (error) {
      this.logger.error(`Error finding submissions by class: ${error.message}`, error.stack);
      return [];
    }
  }

  async findOneWithPageUrls(id: string): Promise<Submission & { pageUrls: string[] }> {
    const submission = await this.findOne(id);
    
    // Générer les URLs présignées pour les images raw
    const pageUrls = [];
    
    if (submission.rawPages && submission.rawPages.length > 0) {
      // Générer des URLs présignées pour chaque page
      const urlsMap = await this.storageService.getPresignedDownloadUrls(submission.rawPages);
      
      // Conserver l'ordre des pages
      for (const rawPage of submission.rawPages) {
        if (urlsMap[rawPage]) {
          pageUrls.push(urlsMap[rawPage]);
        }
      }
    }
    
    // Retourner la soumission avec les URLs des pages
    return {
      ...(submission as any),
      pageUrls,
    };
  }
} 