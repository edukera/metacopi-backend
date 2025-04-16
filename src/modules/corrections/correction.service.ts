import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { Correction, CorrectionStatus } from './correction.schema';
import { CreateCorrectionDto, UpdateCorrectionDto } from './correction.dto';

@Injectable()
export class CorrectionService {
  constructor(
    @InjectModel(Correction.name) private correctionModel: Model<Correction>,
    @Inject(REQUEST) private request,
  ) {}

  async create(createCorrectionDto: CreateCorrectionDto): Promise<Correction> {
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
    return newCorrection.save();
  }

  async findAll(): Promise<Correction[]> {
    return this.correctionModel.find().exec();
  }

  async findOne(id: string): Promise<Correction> {
    const correction = await this.correctionModel.findById(id).exec();
    if (!correction) {
      throw new NotFoundException(`Correction with ID ${id} not found`);
    }
    return correction;
  }

  async findBySubmission(submissionId: string): Promise<Correction> {
    const correction = await this.correctionModel
      .findOne({ submissionId })
      .exec();
    if (!correction) {
      throw new NotFoundException(
        `Correction for submission ${submissionId} not found`,
      );
    }
    return correction;
  }

  async findByTeacher(teacherId: string): Promise<Correction[]> {
    return this.correctionModel.find({ correctedById: teacherId }).exec();
  }

  async update(
    id: string,
    updateCorrectionDto: UpdateCorrectionDto,
  ): Promise<Correction> {
    const correction = await this.findOne(id);
    
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
    
    return updatedCorrection;
  }

  async remove(id: string): Promise<Correction> {
    const deletedCorrection = await this.correctionModel
      .findByIdAndDelete(id)
      .exec();
    if (!deletedCorrection) {
      throw new NotFoundException(`Correction with ID ${id} not found`);
    }
    return deletedCorrection;
  }

  async removeBySubmission(submissionId: string): Promise<void> {
    await this.correctionModel.deleteMany({ submissionId }).exec();
  }
} 