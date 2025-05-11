import { Injectable, NotFoundException, BadRequestException, Inject, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { Annotation } from './annotation.schema';
import { CreateAnnotationDto, UpdateAnnotationDto, AnnotationResponseDto } from './annotation.dto';
import { CorrectionService } from '../corrections/correction.service';

@Injectable()
export class AnnotationService {
  private readonly logger = new Logger(AnnotationService.name);

  constructor(
    @InjectModel(Annotation.name) private annotationModel: Model<Annotation>,
    private correctionService: CorrectionService,
    @Inject(REQUEST) private request,
  ) {}

  // Convertir un objet Annotation en AnnotationResponseDto
  private toResponseDto(annotation: Annotation): AnnotationResponseDto {
    const annotationDto = new AnnotationResponseDto();
    annotationDto.id = annotation.id;
    annotationDto.correctionId = annotation.correctionId;
    annotationDto.pageId = annotation.pageId;
    annotationDto.value = annotation.value;
    annotationDto.createdByEmail = annotation.createdByEmail;
    annotationDto.createdAt = (annotation as any).createdAt;
    annotationDto.updatedAt = (annotation as any).updatedAt;
    return annotationDto;
  }

  // Convertir une liste d'objets Annotation en liste de AnnotationResponseDto
  private toResponseDtoList(annotations: Annotation[]): AnnotationResponseDto[] {
    return annotations.map(annotation => this.toResponseDto(annotation));
  }

  /**
   * Crée une nouvelle annotation
   * @param createAnnotationDto Les données de l'annotation à créer
   * @returns La nouvelle annotation créée
   */
  async create(createAnnotationDto: CreateAnnotationDto): Promise<AnnotationResponseDto> {
    // Vérifier que la correction existe
    const correction = await this.correctionService.findOne(createAnnotationDto.correctionId);
    if (!correction) {
      throw new NotFoundException(`Correction with ID ${createAnnotationDto.correctionId} not found`);
    }

    // Si createdByEmail n'est pas fourni, utiliser l'utilisateur courant
    if (!createAnnotationDto.createdByEmail) {
      createAnnotationDto.createdByEmail = this.request.user.email;
    }

    try {
      // Valider que le champ value est du JSON valide
      JSON.parse(createAnnotationDto.value);
    } catch (error) {
      throw new BadRequestException('Field "value" must be a valid JSON string');
    }

    const newAnnotation = new this.annotationModel(createAnnotationDto);
    const savedAnnotation = await newAnnotation.save();
    return this.toResponseDto(savedAnnotation);
  }

  /**
   * Trouve toutes les annotations liées à une correction
   * @param correctionId L'ID de la correction
   * @returns Liste des annotations
   */
  async findByCorrection(correctionId: string): Promise<AnnotationResponseDto[]> {
    const annotations = await this.annotationModel.find({ correctionId }).exec();
    return this.toResponseDtoList(annotations);
  }

  /**
   * Trouve une annotation par son ID
   * @param id L'ID de l'annotation
   * @returns L'annotation trouvée
   */
  async findById(id: string): Promise<AnnotationResponseDto> {
    // Recherche d'abord par id logique, puis par _id MongoDB si non trouvé
    let annotation = await this.annotationModel.findOne({ id }).exec();
    if (!annotation) {
      annotation = await this.annotationModel.findById(id).exec();
    }
    if (!annotation) {
      throw new NotFoundException(`Annotation with logical ID or MongoDB ID '${id}' not found`);
    }
    return this.toResponseDto(annotation);
  }

  /**
   * Trouve une annotation par correction et clé
   * @param correctionId L'ID de la correction
   * @param key La clé de l'annotation
   * @returns L'annotation trouvée
   */
  async findByKey(correctionId: string, key: string): Promise<AnnotationResponseDto> {
    const annotation = await this.annotationModel.findOne({ correctionId, key }).exec();
    if (!annotation) {
      throw new NotFoundException(`Annotation with key ${key} not found for correction ${correctionId}`);
    }
    return this.toResponseDto(annotation);
  }

  /**
   * Met à jour une annotation
   * @param id L'ID de l'annotation à mettre à jour
   * @param updateAnnotationDto Les données de mise à jour
   * @returns L'annotation mise à jour
   */
  async update(id: string, updateAnnotationDto: UpdateAnnotationDto): Promise<AnnotationResponseDto> {
    await this.findAnnotationEntity(id);

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

    return this.toResponseDto(updatedAnnotation);
  }

  /**
   * Supprime une annotation
   * @param id L'ID de l'annotation à supprimer
   */
  async remove(id: string): Promise<void> {
    await this.findAnnotationEntity(id);
    const deletedAnnotation = await this.annotationModel.findByIdAndDelete(id).exec();
    if (!deletedAnnotation) {
      throw new NotFoundException(`Annotation with ID ${id} not found`);
    }
  }

  // Pour l'utilisation interne uniquement - récupère l'entité Annotation sans la convertir en DTO
  private async findAnnotationEntity(id: string): Promise<Annotation> {
    const annotation = await this.annotationModel.findById(id).exec();
    if (!annotation) {
      throw new NotFoundException(`Annotation with ID ${id} not found`);
    }
    return annotation;
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