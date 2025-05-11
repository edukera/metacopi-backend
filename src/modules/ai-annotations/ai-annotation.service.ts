import { Injectable, NotFoundException, BadRequestException, Inject, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { AIAnnotation } from './ai-annotation.schema';
import { CreateAIAnnotationDto, UpdateAIAnnotationDto, AIAnnotationResponseDto } from './ai-annotation.dto';
import { CorrectionService } from '../corrections/correction.service';

@Injectable()
export class AIAnnotationService {
  private readonly logger = new Logger(AIAnnotationService.name);

  constructor(
    @InjectModel(AIAnnotation.name) private aiAnnotationModel: Model<AIAnnotation>,
    private correctionService: CorrectionService,
    @Inject(REQUEST) private request,
  ) {}

  // Convertir un objet AIAnnotation en AIAnnotationResponseDto
  private toResponseDto(aiAnnotation: AIAnnotation): AIAnnotationResponseDto {
    // Les annotations (si présentes) sont des ids logiques (pas des ObjectId Mongo)
    const aiAnnotationDto = new AIAnnotationResponseDto();
    aiAnnotationDto.id = aiAnnotation.id;
    aiAnnotationDto.correctionId = aiAnnotation.correctionId;
    aiAnnotationDto.pageId = aiAnnotation.pageId;
    aiAnnotationDto.value = aiAnnotation.value;
    aiAnnotationDto.createdByEmail = aiAnnotation.createdByEmail;
    aiAnnotationDto.createdAt = (aiAnnotation as any).createdAt;
    aiAnnotationDto.updatedAt = (aiAnnotation as any).updatedAt;
    aiAnnotationDto.annotations = (aiAnnotation as any).annotations || [];
    return aiAnnotationDto;
  }

  // Convertir une liste d'objets AIAnnotation en liste de AIAnnotationResponseDto
  private toResponseDtoList(aiAnnotations: AIAnnotation[]): AIAnnotationResponseDto[] {
    return aiAnnotations.map(aiAnnotation => this.toResponseDto(aiAnnotation));
  }

  /**
   * Crée une nouvelle annotation IA
   * @param createAIAnnotationDto Les données de l'annotation IA à créer
   * @returns La nouvelle annotation IA créée
   */
  async create(createAIAnnotationDto: CreateAIAnnotationDto): Promise<AIAnnotationResponseDto> {
    // Vérifier que la correction existe
    const correction = await this.correctionService.findOne(createAIAnnotationDto.correctionId);
    if (!correction) {
      throw new ForbiddenException(`Correction with ID ${createAIAnnotationDto.correctionId} not found or access denied`);
    }

    // Si createdByEmail n'est pas fourni, utiliser l'utilisateur courant ou "ai-system"
    if (!createAIAnnotationDto.createdByEmail) {
      createAIAnnotationDto.createdByEmail = this.request.user?.email || 'ai-system';
    }

    try {
      // Valider que le champ value est du JSON valide
      JSON.parse(createAIAnnotationDto.value);
    } catch (error) {
      throw new BadRequestException('Field "value" must be a valid JSON string');
    }

    // Les annotations doivent être des ids logiques (string)
    const newAIAnnotation = new this.aiAnnotationModel(createAIAnnotationDto);
    const savedAIAnnotation = await newAIAnnotation.save();
    return this.toResponseDto(savedAIAnnotation);
  }

  /**
   * Trouve toutes les annotations IA liées à une correction
   * @param correctionId L'ID logique de la correction
   * @returns Liste des annotations IA
   */
  async findByCorrection(correctionId: string): Promise<AIAnnotationResponseDto[]> {
    const aiAnnotations = await this.aiAnnotationModel.find({ correctionId }).exec();
    return this.toResponseDtoList(aiAnnotations);
  }

  /**
   * Trouve une annotation IA par son ID logique
   * @param id L'ID logique de l'annotation IA
   * @returns L'annotation IA trouvée
   */
  async findById(id: string): Promise<AIAnnotationResponseDto> {
    const aiAnnotation = await this.aiAnnotationModel.findOne({ id }).exec();
    if (!aiAnnotation) {
      throw new NotFoundException(`AI Annotation with ID '${id}' not found`);
    }
    return this.toResponseDto(aiAnnotation);
  }

  /**
   * Met à jour une annotation IA
   * @param id L'ID logique de l'annotation IA à mettre à jour
   * @param updateAIAnnotationDto Les données de mise à jour
   * @returns L'annotation IA mise à jour
   */
  async update(id: string, updateAIAnnotationDto: UpdateAIAnnotationDto): Promise<AIAnnotationResponseDto> {
    // Valider que value est du JSON valide si présent
    if (updateAIAnnotationDto.value) {
      try {
        JSON.parse(updateAIAnnotationDto.value);
      } catch (error) {
        throw new BadRequestException('Field "value" must be a valid JSON string');
      }
    }

    const updatedAIAnnotation = await this.aiAnnotationModel.findOneAndUpdate(
      { id },
      { $set: updateAIAnnotationDto },
      { new: true },
    ).exec();

    if (!updatedAIAnnotation) {
      throw new NotFoundException(`AI Annotation with ID ${id} not found`);
    }

    return this.toResponseDto(updatedAIAnnotation);
  }

  /**
   * Supprime une annotation IA
   * @param id L'ID logique de l'annotation IA à supprimer
   */
  async remove(id: string): Promise<void> {
    const deletedAIAnnotation = await this.aiAnnotationModel.findOneAndDelete({ id }).exec();
    if (!deletedAIAnnotation) {
      throw new NotFoundException(`AI Annotation with ID ${id} not found`);
    }
  }

  // Pour l'utilisation interne uniquement - récupère l'entité AIAnnotation sans la convertir en DTO
  private async findAIAnnotationEntity(id: string): Promise<AIAnnotation> {
    const aiAnnotation = await this.aiAnnotationModel.findOne({ id }).exec();
    if (!aiAnnotation) {
      throw new NotFoundException(`AI Annotation with ID ${id} not found`);
    }
    return aiAnnotation;
  }
} 