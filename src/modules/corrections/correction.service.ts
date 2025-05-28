import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { Correction, CorrectionStatus } from './correction.schema';
import { CreateCorrectionDto, UpdateCorrectionDto, CorrectionResponseDto } from './correction.dto';
import { SubmissionService } from '../submissions/submission.service';
import { UserRole } from '../users/user.schema';

@Injectable()
export class CorrectionService {
  constructor(
    @InjectModel(Correction.name) private correctionModel: Model<Correction>,
    @Inject(REQUEST) private request,
    @Inject(forwardRef(() => SubmissionService))
    private readonly submissionService: SubmissionService,
  ) {}

  // Convertir un objet Correction en CorrectionResponseDto
  private toResponseDto(correction: Correction): CorrectionResponseDto {
    const correctionDto = new CorrectionResponseDto();
    correctionDto.id = correction.id;
    correctionDto.submissionId = correction.submissionId;
    correctionDto.correctedByEmail = correction.correctedByEmail;
    correctionDto.status = correction.status;
    correctionDto.grade = correction.grade;
    correctionDto.appreciation = correction.appreciation;
    correctionDto.scores = correction.scores;
    correctionDto.finalizedAt = correction.finalizedAt;
    correctionDto.createdAt = (correction as any).createdAt;
    correctionDto.updatedAt = (correction as any).updatedAt;
    return correctionDto;
  }

  // Convertir une liste d'objets Correction en liste de CorrectionResponseDto
  private toResponseDtoList(corrections: Correction[]): CorrectionResponseDto[] {
    return corrections.map(correction => this.toResponseDto(correction));
  }

  async create(createCorrectionDto: CreateCorrectionDto): Promise<CorrectionResponseDto> {
    // If correctedByEmail is not provided, use the current user
    if (!createCorrectionDto.correctedByEmail) {
      createCorrectionDto.correctedByEmail = this.request.user.email;
    }

    // Check if a correction already exists for this submission
    const existingCorrection = await this.correctionModel.findOne({
      submissionId: createCorrectionDto.submissionId,
    });

    if (existingCorrection) {
      throw new BadRequestException(
        'A correction already exists for this submission',
      );
    }

    const newCorrection = new this.correctionModel(createCorrectionDto);
    const savedCorrection = await newCorrection.save();
    return this.toResponseDto(savedCorrection);
  }

  async findAll(): Promise<CorrectionResponseDto[]> {
    // Si l'utilisateur est admin, retourner toutes les corrections
    if (this.request.user.role === UserRole.ADMIN) {
      const corrections = await this.correctionModel.find().exec();
      return this.toResponseDtoList(corrections);
    }
    
    // Sinon, filtrer les corrections selon l'utilisateur connecté
    const userEmail = this.request.user.email;
    
    // Récupérer les corrections où l'utilisateur est le correcteur
    const corrections = await this.correctionModel.find({ 
      correctedByEmail: userEmail 
    }).exec();
    
    return this.toResponseDtoList(corrections);
  }

  async findOne(id: string): Promise<CorrectionResponseDto> {
    // Recherche d'abord par id logique, puis par _id MongoDB si non trouvé
    let correction = await this.correctionModel.findOne({ id }).exec();
    if (!correction) {
      correction = await this.correctionModel.findById(id).exec();
    }
    if (!correction) {
      throw new NotFoundException(`Correction with logical ID or MongoDB ID '${id}' not found`);
    }
    return this.toResponseDto(correction);
  }

  async findBySubmission(submissionId: string): Promise<CorrectionResponseDto> {
    const correction = await this.correctionModel
      .findOne({ submissionId })
      .exec();
    if (!correction) {
      throw new NotFoundException(
        `Correction for submission ${submissionId} not found`,
      );
    }
    return this.toResponseDto(correction);
  }

  async findByTeacher(teacherEmail: string): Promise<CorrectionResponseDto[]> {
    const corrections = await this.correctionModel.find({ correctedByEmail: teacherEmail }).exec();
    return this.toResponseDtoList(corrections);
  }

  async findByTask(taskId: string): Promise<CorrectionResponseDto[]> {
    // Récupérer toutes les submissions pour cette tâche
    const submissions = await this.submissionService.findByTask(taskId);
    
    // Extraire les IDs des submissions
    const submissionIds = submissions.map(submission => submission.id);
    
    // Si aucune submission, retourner un tableau vide
    if (submissionIds.length === 0) {
      return [];
    }
    
    // Récupérer toutes les corrections pour ces submissions
    const corrections = await this.correctionModel.find({ 
      submissionId: { $in: submissionIds } 
    }).exec();
    
    return this.toResponseDtoList(corrections);
  }

  async update(
    id: string,
    updateCorrectionDto: UpdateCorrectionDto,
  ): Promise<CorrectionResponseDto> {
    // Recherche d'abord par id logique, puis par _id MongoDB si non trouvé
    let correction = await this.correctionModel.findOne({ id }).exec();
    if (!correction) {
      correction = await this.correctionModel.findById(id).exec();
    }
    if (!correction) {
      throw new NotFoundException(`Correction with logical ID or MongoDB ID '${id}' not found`);
    }
    // If the user changes status from IN_PROGRESS to COMPLETED, add finalization date
    if (updateCorrectionDto.status === CorrectionStatus.COMPLETED && 
        correction.status !== CorrectionStatus.COMPLETED) {
      updateCorrectionDto.finalizedAt = new Date();
    }
    const updatedCorrection = await this.correctionModel
      .findByIdAndUpdate(correction._id, updateCorrectionDto, { new: true })
      .exec();
    if (!updatedCorrection) {
      throw new NotFoundException(`Correction with ID ${id} not found`);
    }
    return this.toResponseDto(updatedCorrection);
  }

  async remove(id: string): Promise<void> {
    // Recherche d'abord par id logique, puis par _id MongoDB si non trouvé
    let correction = await this.correctionModel.findOne({ id }).exec();
    if (!correction) {
      correction = await this.correctionModel.findById(id).exec();
    }
    if (!correction) {
      throw new NotFoundException(`Correction with logical ID or MongoDB ID '${id}' not found`);
    }
    const deletedCorrection = await this.correctionModel
      .findByIdAndDelete(correction._id)
      .exec();
    if (!deletedCorrection) {
      throw new NotFoundException(`Correction with ID ${id} not found`);
    }
  }

  // Pour l'utilisation interne uniquement - récupère l'entité Correction sans la convertir en DTO
  private async findCorrectionEntity(id: string): Promise<Correction> {
    // Recherche d'abord par id logique, puis par _id MongoDB si non trouvé
    let correction = await this.correctionModel.findOne({ id }).exec();
    if (!correction) {
      correction = await this.correctionModel.findById(id).exec();
    }
    if (!correction) {
      throw new NotFoundException(`Correction with logical ID or MongoDB ID '${id}' not found`);
    }
    return correction;
  }

  async removeBySubmission(submissionId: string): Promise<void> {
    await this.correctionModel.deleteMany({ submissionId }).exec();
  }
} 