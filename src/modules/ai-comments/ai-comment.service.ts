import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { AIComment } from './ai-comment.schema';
import { CreateAICommentDto, UpdateAICommentDto, AICommentResponseDto, AICommentStatus } from './ai-comment.dto';
import { CorrectionService } from '../corrections/correction.service';
import { SubmissionService } from '../submissions/submission.service';
import { TaskService } from '../tasks/task.service';
import { MembershipService } from '../memberships/membership.service';
import { MembershipRole } from '../memberships/membership.schema';

@Injectable()
export class AICommentService {
  private readonly logger = new Logger(AICommentService.name);

  constructor(
    @InjectModel(AIComment.name) private aiCommentModel: Model<AIComment>,
    private correctionService: CorrectionService,
    private submissionService: SubmissionService,
    private taskService: TaskService,
    private membershipService: MembershipService,
    @Inject(REQUEST) private request,
  ) {}

  // Convertir un objet AIComment en AICommentResponseDto
  private toResponseDto(aiComment: AIComment): AICommentResponseDto {
    const aiCommentDto = new AICommentResponseDto();
    aiCommentDto.id = aiComment.id;
    aiCommentDto.correctionId = aiComment.correctionId;
    aiCommentDto.pageId = aiComment.pageId;
    aiCommentDto.pageY = aiComment.pageY;
    aiCommentDto.type = aiComment.type || 'note';
    aiCommentDto.color = aiComment.color || '#FFD700';
    aiCommentDto.markdown = aiComment.markdown || 'note';
    aiCommentDto.text = aiComment.text;
    aiCommentDto.annotations = aiComment.annotations || [];
    aiCommentDto.status = aiComment.status || AICommentStatus.PENDING;
    aiCommentDto.createdByEmail = aiComment.createdByEmail;
    aiCommentDto.createdAt = (aiComment as any).createdAt;
    aiCommentDto.updatedAt = (aiComment as any).updatedAt;
    return aiCommentDto;
  }

  // Convertir une liste d'objets AIComment en liste de AICommentResponseDto
  private toResponseDtoList(aiComments: AIComment[]): AICommentResponseDto[] {
    return aiComments.map(aiComment => this.toResponseDto(aiComment));
  }

  /**
   * Create a new AI comment
   * @param createAICommentDto Data for creating the AI comment
   * @returns Newly created AI comment
   */
  async create(createAICommentDto: CreateAICommentDto): Promise<AICommentResponseDto> {
    if (!createAICommentDto.createdByEmail) {
      createAICommentDto.createdByEmail = this.request.user.email;
    }
    
    // S'assurer que le statut est défini, par défaut 'pending'
    if (createAICommentDto.status === undefined) {
      createAICommentDto.status = AICommentStatus.PENDING;
    }
    
    const newAIComment = new this.aiCommentModel(createAICommentDto);
    this.logger.log(`Creating AI comment with ID ${createAICommentDto.id} and status ${createAICommentDto.status}`);
    const savedAIComment = await newAIComment.save();
    return this.toResponseDto(savedAIComment);
  }

  /**
   * Find all AI comments
   * @returns Array of all AI comments
   */
  async findAll(): Promise<AICommentResponseDto[]> {
    const aiComments = await this.aiCommentModel.find().exec();
    return this.toResponseDtoList(aiComments);
  }

  /**
   * Find an AI comment by ID
   * @param id AI Comment ID
   * @returns AI Comment if found
   */
  async findOne(id: string): Promise<AICommentResponseDto> {
    // Recherche d'abord par id logique, puis par _id MongoDB si non trouvé
    let aiComment = await this.aiCommentModel.findOne({ id }).exec();
    if (!aiComment) {
      aiComment = await this.aiCommentModel.findById(id).exec();
    }
    if (!aiComment) {
      throw new NotFoundException(`AI Comment with logical ID or MongoDB ID '${id}' not found`);
    }
    return this.toResponseDto(aiComment);
  }

  /**
   * Find AI comments for a specific correction
   * @param correctionId Correction ID
   * @returns Array of AI comments for the correction
   */
  async findByCorrection(correctionId: string): Promise<AICommentResponseDto[]> {
    // Check if the correction exists
    try {
      await this.correctionService.findOne(correctionId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`Correction with ID ${correctionId} not found`);
      }
      throw error;
    }
    // Les vérifications d'accès sont maintenant gérées par le guard
    const aiComments = await this.aiCommentModel.find({ correctionId }).exec();
    return this.toResponseDtoList(aiComments);
  }

  /**
   * Update an AI comment
   * @param id AI Comment ID
   * @param updateAICommentDto Data for updating the AI comment
   * @returns Updated AI comment
   */
  async update(
    id: string,
    updateAICommentDto: UpdateAICommentDto,
  ): Promise<AICommentResponseDto> {
    // Vérifier que le commentaire AI existe
    await this.findAICommentEntity(id);
    
    // Les vérifications d'accès sont maintenant gérées par le guard
    const updatedAIComment = await this.aiCommentModel
      .findByIdAndUpdate(id, updateAICommentDto, { new: true })
      .exec();
      
    if (!updatedAIComment) {
      throw new NotFoundException(`AI Comment with ID ${id} not found`);
    }
    
    return this.toResponseDto(updatedAIComment);
  }

  /**
   * Remove an AI comment
   * @param id AI Comment ID
   * @returns Removed AI comment
   */
  async remove(id: string): Promise<void> {
    // Vérifier que le commentaire AI existe
    await this.findAICommentEntity(id);
    
    // Les vérifications d'accès sont maintenant gérées par le guard
    const deletedAIComment = await this.aiCommentModel
      .findByIdAndDelete(id)
      .exec();
      
    if (!deletedAIComment) {
      throw new NotFoundException(`AI Comment with ID ${id} not found`);
    }
  }

  /**
   * Remove all AI comments for a correction
   * @param correctionId Correction ID
   */
  async removeByCorrection(correctionId: string): Promise<void> {
    // Les vérifications d'accès sont maintenant gérées par le guard
    await this.aiCommentModel.deleteMany({ correctionId }).exec();
  }

  /**
   * Check if a user has teacher access to a correction
   * @param userId User ID
   * @param correctionId Correction ID
   * @returns Boolean indicating if the user has teacher access
   */
  async checkTeacherAccess(userId: string, correctionId: string): Promise<boolean> {
    try {
      // Get the correction
      const correction = await this.correctionService.findOne(correctionId);
      
      // Si l'utilisateur est l'enseignant qui a créé la correction, il a accès
      if (correction.correctedByEmail === userId) {
        return true;
      }
      
      // Vérifier si l'utilisateur est enseignant dans la classe associée
      const submission = await this.submissionService.findOne(correction.submissionId);
      const task = await this.taskService.findOne(submission.taskId);
      const isTeacher = await this.membershipService.checkMembershipRole(userId, task.classId, MembershipRole.TEACHER);
      
      return isTeacher;
    } catch (error) {
      if (error instanceof NotFoundException) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Check if a user has student access to a correction
   * @param userId User ID
   * @param correctionId Correction ID
   * @returns Boolean indicating if the user has student access
   */
  async checkStudentAccess(userId: string, correctionId: string): Promise<boolean> {
    try {
      // Get the correction
      const correction = await this.correctionService.findOne(correctionId);
      
      // Vérifier si l'utilisateur est l'étudiant propriétaire de la soumission
      const submission = await this.submissionService.findOne(correction.submissionId);
      
      return submission.studentEmail === userId;
    } catch (error) {
      if (error instanceof NotFoundException) {
        return false;
      }
      throw error;
    }
  }

  // Pour l'utilisation interne uniquement - récupère l'entité AIComment sans la convertir en DTO
  private async findAICommentEntity(id: string): Promise<AIComment> {
    const aiComment = await this.aiCommentModel.findById(id).exec();
    if (!aiComment) {
      throw new NotFoundException(`AI Comment with ID ${id} not found`);
    }
    return aiComment;
  }
} 