import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { Correction, CorrectionStatus } from './correction.schema';
import { CreateCorrectionDto, UpdateCorrectionDto, CorrectionResponseDto } from './correction.dto';
import { SubmissionService } from '../submissions/submission.service';

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
    correctionDto.id = correction['_id'].toString();
    correctionDto.submissionId = correction.submissionId?.toString();
    correctionDto.correctedById = correction.correctedById?.toString();
    correctionDto.status = correction.status;
    correctionDto.annotations = correction.annotations;
    correctionDto.grade = correction.grade;
    correctionDto.appreciation = correction.appreciation;
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
    // If correctedById is not provided, use the current user
    if (!createCorrectionDto.correctedById) {
      createCorrectionDto.correctedById = this.request.user.sub;
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
    const corrections = await this.correctionModel.find().exec();
    return this.toResponseDtoList(corrections);
  }

  async findOne(id: string): Promise<CorrectionResponseDto> {
    const correction = await this.correctionModel.findById(id).exec();
    if (!correction) {
      throw new NotFoundException(`Correction with ID ${id} not found`);
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

  async findByTeacher(teacherId: string): Promise<CorrectionResponseDto[]> {
    const corrections = await this.correctionModel.find({ correctedById: teacherId }).exec();
    return this.toResponseDtoList(corrections);
  }

  async update(
    id: string,
    updateCorrectionDto: UpdateCorrectionDto,
  ): Promise<CorrectionResponseDto> {
    const correction = await this.findCorrectionEntity(id);
    
    // If the user changes status from IN_PROGRESS to COMPLETED, add finalization date
    if (updateCorrectionDto.status === CorrectionStatus.COMPLETED && 
        correction.status !== CorrectionStatus.COMPLETED) {
      updateCorrectionDto.finalizedAt = new Date();
    }
    
    const updatedCorrection = await this.correctionModel
      .findByIdAndUpdate(id, updateCorrectionDto, { new: true })
      .exec();
      
    if (!updatedCorrection) {
      throw new NotFoundException(`Correction with ID ${id} not found`);
    }
    
    return this.toResponseDto(updatedCorrection);
  }

  async remove(id: string): Promise<void> {
    await this.findCorrectionEntity(id);
    const deletedCorrection = await this.correctionModel
      .findByIdAndDelete(id)
      .exec();
    if (!deletedCorrection) {
      throw new NotFoundException(`Correction with ID ${id} not found`);
    }
  }

  // Pour l'utilisation interne uniquement - récupère l'entité Correction sans la convertir en DTO
  private async findCorrectionEntity(id: string): Promise<Correction> {
    const correction = await this.correctionModel.findById(id).exec();
    if (!correction) {
      throw new NotFoundException(`Correction with ID ${id} not found`);
    }
    return correction;
  }

  async removeBySubmission(submissionId: string): Promise<void> {
    await this.correctionModel.deleteMany({ submissionId }).exec();
  }
} 