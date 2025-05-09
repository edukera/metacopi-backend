import { Injectable, NotFoundException, BadRequestException, Inject, Logger, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { Submission, SubmissionStatus } from './submission.schema';
import { CreateSubmissionDto, UpdateSubmissionDto, SubmissionResponseDto } from './submission.dto';
import { CorrectionService } from '../corrections/correction.service';
import { TaskService } from '../tasks/task.service';
import { StorageService } from '../storage/storage.service';

// Interface pour le type de retour des pages
export interface PageInfo {
  id: string;
  url: string;
  width: number;
  height: number;
}

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

  // Convertir un objet Submission en SubmissionResponseDto
  private toResponseDto(submission: Submission): SubmissionResponseDto {
    const submissionDto = new SubmissionResponseDto();
    submissionDto.id = submission['_id'].toString();
    submissionDto.studentId = submission.studentId?.toString();
    submissionDto.taskId = submission.taskId?.toString();
    submissionDto.uploadedBy = submission.uploadedBy?.toString();
    submissionDto.status = submission.status;
    submissionDto.rawPages = submission.rawPages || [];
    submissionDto.processedPages = submission.processedPages || [];
    submissionDto.submittedAt = submission.submittedAt;
    submissionDto.reviewedAt = submission.reviewedAt;
    submissionDto.createdAt = (submission as any).createdAt;
    submissionDto.updatedAt = (submission as any).updatedAt;
    return submissionDto;
  }

  // Convertir une liste d'objets Submission en liste de SubmissionResponseDto
  private toResponseDtoList(submissions: Submission[]): SubmissionResponseDto[] {
    return submissions.map(submission => this.toResponseDto(submission));
  }

  async create(createSubmissionDto: CreateSubmissionDto): Promise<SubmissionResponseDto> {
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
    const savedSubmission = await newSubmission.save();
    return this.toResponseDto(savedSubmission);
  }

  async findAll(): Promise<SubmissionResponseDto[]> {
    const submissions = await this.submissionModel.find().exec();
    return this.toResponseDtoList(submissions);
  }

  async findOne(id: string): Promise<SubmissionResponseDto> {
    const submission = await this.submissionModel.findById(id).exec();
    if (!submission) {
      throw new NotFoundException(`Submission with ID ${id} not found`);
    }
    return this.toResponseDto(submission);
  }

  async findByTask(taskId: string): Promise<SubmissionResponseDto[]> {
    const submissions = await this.submissionModel.find({ taskId }).exec();
    return this.toResponseDtoList(submissions);
  }

  async findByStudent(studentId: string): Promise<SubmissionResponseDto[]> {
    const submissions = await this.submissionModel.find({ studentId }).exec();
    return this.toResponseDtoList(submissions);
  }

  async findByStudentAndTask(
    studentId: string,
    taskId: string,
  ): Promise<SubmissionResponseDto> {
    const submission = await this.submissionModel
      .findOne({ studentId, taskId })
      .exec();
    if (!submission) {
      throw new NotFoundException(
        `Submission for student ${studentId} and task ${taskId} not found`,
      );
    }
    return this.toResponseDto(submission);
  }

  async update(
    id: string,
    updateSubmissionDto: UpdateSubmissionDto,
  ): Promise<SubmissionResponseDto> {
    const submission = await this.findSubmissionEntity(id);
    
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
    
    return this.toResponseDto(updatedSubmission);
  }

  async remove(id: string): Promise<void> {
    const submission = await this.findSubmissionEntity(id);
    
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
  }

  // Pour l'utilisation interne uniquement - récupère l'entité Submission sans la convertir en DTO
  private async findSubmissionEntity(id: string): Promise<Submission> {
    const submission = await this.submissionModel.findById(id).exec();
    if (!submission) {
      throw new NotFoundException(`Submission with ID ${id} not found`);
    }
    return submission;
  }

  async removeByTask(taskId: string): Promise<void> {
    // Get all submissions for this task
    const submissions = await this.submissionModel.find({ taskId }).exec();
    
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
  async findByClass(classId: string): Promise<SubmissionResponseDto[]> {
    this.logger.debug(`Finding submissions for class: ${classId}`);
    
    try {
      // 1. Trouver toutes les tâches de cette classe
      const tasks = await this.taskService.findByClass(classId);
      
      if (!tasks || tasks.length === 0) {
        this.logger.debug(`No tasks found for class ${classId}`);
        return [];
      }
      
      // 2. Extraire les IDs des tâches
      const taskIds = tasks.map(task => task.id.toString());
      this.logger.debug(`Found ${taskIds.length} tasks for class ${classId}`);
      
      // 3. Trouver toutes les soumissions pour ces tâches
      const submissions = await this.submissionModel.find({
        taskId: { $in: taskIds }
      }).exec();

      return this.toResponseDtoList(submissions);
    } catch (error) {
      this.logger.error(`Error finding submissions by class: ${error.message}`, error.stack);
      return [];
    }
  }

  async findOneWithPageUrls(id: string): Promise<SubmissionResponseDto & { pageUrls: PageInfo[] }> {
    const submission = await this.findSubmissionEntity(id);
    const submissionDto = this.toResponseDto(submission);
    
    // Générer les URLs présignées pour les images raw
    const pageUrls: PageInfo[] = [];
    
    if (submission.rawPages && submission.rawPages.length > 0) {
      // Générer des URLs présignées pour chaque page
      const urlsMap = await this.storageService.getPresignedDownloadUrls(submission.rawPages);
      
      // Conserver l'ordre des pages et créer les objets PageInfo
      submission.rawPages.forEach((rawPage, index) => {
        if (urlsMap[rawPage]) {
          // Pour cet exemple, nous utilisons des valeurs par défaut pour width et height
          // Dans un cas réel, ces valeurs devraient provenir des métadonnées de l'image
          pageUrls.push({
            id: `p${index + 1}`,
            url: urlsMap[rawPage],
            width: 3468, // Valeur par défaut, à remplacer par la vraie largeur
            height: 4624, // Valeur par défaut, à remplacer par la vraie hauteur
          });
        }
      });
    }
    
    // Retourner la soumission avec les URLs des pages
    return {
      ...submissionDto,
      pageUrls,
    };
  }
} 