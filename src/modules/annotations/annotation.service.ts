import { Injectable, NotFoundException, BadRequestException, Inject, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { Annotation } from './annotation.schema';
import { CreateAnnotationDto, UpdateAnnotationDto } from './annotation.dto';
import { CorrectionService } from '../corrections/correction.service';

@Injectable()
export class AnnotationService {
  constructor(
    @InjectModel(Annotation.name) private annotationModel: Model<Annotation>,
    private correctionService: CorrectionService,
    @Inject(REQUEST) private request,
  ) {}

  /**
   * Crée une nouvelle annotation
   * @param createAnnotationDto Les données de l'annotation à créer
   * @returns La nouvelle annotation créée
   */
  async create(createAnnotationDto: CreateAnnotationDto): Promise<Annotation> {
    // Vérifier que la correction existe
    const correction = await this.correctionService.findOne(createAnnotationDto.correctionId);
    if (!correction) {
      throw new NotFoundException(`Correction with ID ${createAnnotationDto.correctionId} not found`);
    }

    try {
      // Valider que le champ value est du JSON valide
      JSON.parse(createAnnotationDto.value);
    } catch (error) {
      throw new BadRequestException('Field "value" must be a valid JSON string');
    }

    const newAnnotation = new this.annotationModel(createAnnotationDto);
    return newAnnotation.save();
  }

  /**
   * Trouve toutes les annotations liées à une correction
   * @param correctionId L'ID de la correction
   * @returns Liste des annotations
   */
  async findByCorrection(correctionId: string): Promise<Annotation[]> {
    return this.annotationModel.find({ correctionId }).exec();
  }

  /**
   * Trouve une annotation par son ID
   * @param id L'ID de l'annotation
   * @returns L'annotation trouvée
   */
  async findById(id: string): Promise<Annotation> {
    const annotation = await this.annotationModel.findById(id).exec();
    if (!annotation) {
      throw new NotFoundException(`Annotation with ID ${id} not found`);
    }
    return annotation;
  }

  /**
   * Trouve une annotation par correction et clé
   * @param correctionId L'ID de la correction
   * @param key La clé de l'annotation
   * @returns L'annotation trouvée
   */
  async findByKey(correctionId: string, key: string): Promise<Annotation> {
    const annotation = await this.annotationModel.findOne({ correctionId, key }).exec();
    if (!annotation) {
      throw new NotFoundException(`Annotation with key ${key} not found for correction ${correctionId}`);
    }
    return annotation;
  }

  /**
   * Met à jour une annotation
   * @param id L'ID de l'annotation à mettre à jour
   * @param updateAnnotationDto Les données de mise à jour
   * @returns L'annotation mise à jour
   */
  async update(id: string, updateAnnotationDto: UpdateAnnotationDto): Promise<Annotation> {
    const annotation = await this.findById(id);

    // Valider que value est du JSON valide si présent
    if (updateAnnotationDto.value) {
      try {
        JSON.parse(updateAnnotationDto.value);
      } catch (error) {
        throw new BadRequestException('Field "value" must be a valid JSON string');
      }
    }

    const updatedAnnotation = await this.annotationModel.findByIdAndUpdate(
      id,
      { $set: updateAnnotationDto },
      { new: true },
    ).exec();

    return updatedAnnotation;
  }

  /**
   * Supprime une annotation
   * @param id L'ID de l'annotation à supprimer
   * @returns L'annotation supprimée
   */
  async remove(id: string): Promise<Annotation> {
    const annotation = await this.findById(id);
    return this.annotationModel.findByIdAndDelete(id).exec();
  }

  /**
   * Vérifie si l'utilisateur actuel est enseignant de la classe associée à la correction
   * @param correctionId L'ID de la correction
   * @returns true si l'utilisateur est enseignant, sinon lance une exception
   */
  async verifyTeacherAccess(correctionId: string): Promise<boolean> {
    const correction = await this.correctionService.findOne(correctionId);
    
    // Logique qui vérifie si l'utilisateur actuel est enseignant de la classe
    // associée à cette correction. Cette logique dépendra de votre système de rôles.
    
    // Si l'utilisateur n'est pas un enseignant ou un admin, on rejette l'accès
    if (!this.request.user.isTeacherForCorrection(correction)) {
      throw new ForbiddenException('You must be a teacher of the class to modify annotations');
    }
    
    return true;
  }
} 