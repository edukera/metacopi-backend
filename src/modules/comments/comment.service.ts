import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { Comment } from './comment.schema';
import { CreateCommentDto, UpdateCommentDto, CommentResponseDto } from './comment.dto';
import { CorrectionService } from '../corrections/correction.service';
import { SubmissionService } from '../submissions/submission.service';
import { TaskService } from '../tasks/task.service';
import { MembershipService } from '../memberships/membership.service';
import { MembershipRole } from '../memberships/membership.schema';

// Interface pour la création d'un commentaire avec le correctionId requis
interface CreateCommentWithCorrectionIdDto extends CreateCommentDto {
  correctionId: string;
}

@Injectable()
export class CommentService {
  private readonly logger = new Logger(CommentService.name);

  constructor(
    @InjectModel(Comment.name) private commentModel: Model<Comment>,
    private correctionService: CorrectionService,
    private submissionService: SubmissionService,
    private taskService: TaskService,
    private membershipService: MembershipService,
    @Inject(REQUEST) private request,
  ) {}

  // Convertir un objet Comment en CommentResponseDto
  private toResponseDto(comment: Comment): CommentResponseDto {
    // Les annotations sont des ids logiques (pas des ObjectId Mongo)
    const commentDto = new CommentResponseDto();
    commentDto.id = comment.id;
    commentDto.correctionId = comment.correctionId;
    commentDto.pageId = comment.pageId;
    commentDto.pageY = comment.pageY;
    commentDto.type = comment.type || 'note';
    commentDto.color = comment.color || '#FFD700';
    commentDto.markdown = comment.markdown;
    commentDto.text = comment.text;
    commentDto.annotations = comment.annotations || [];
    commentDto.createdByEmail = comment.createdByEmail;
    commentDto.AISourceID = comment.AISourceID;
    commentDto.createdAt = (comment as any).createdAt;
    commentDto.updatedAt = (comment as any).updatedAt;
    return commentDto;
  }

  // Convertir une liste d'objets Comment en liste de CommentResponseDto
  private toResponseDtoList(comments: Comment[]): CommentResponseDto[] {
    return comments.map(comment => this.toResponseDto(comment));
  }

  /**
   * Create a new comment
   * @param commentData Data for creating the comment, including correctionId
   * @returns Newly created comment
   */
  async create(commentData: CreateCommentWithCorrectionIdDto): Promise<CommentResponseDto> {
    if (!commentData.createdByEmail) {
      commentData.createdByEmail = this.request.user.email;
    }
    // Les annotations doivent être des ids logiques (string)
    const newComment = new this.commentModel(commentData);
    const savedComment = await newComment.save();
    return this.toResponseDto(savedComment);
  }

  /**
   * Find all comments
   * @returns Array of all comments
   */
  async findAll(): Promise<CommentResponseDto[]> {
    const comments = await this.commentModel.find().exec();
    return this.toResponseDtoList(comments);
  }

  /**
   * Find a comment by logical ID
   * @param id Comment logical ID
   * @returns Comment if found
   */
  async findOne(id: string): Promise<CommentResponseDto> {
    // Recherche uniquement par id logique
    const comment = await this.commentModel.findOne({ id }).exec();
    if (!comment) {
      throw new NotFoundException(`Comment with ID '${id}' not found`);
    }
    return this.toResponseDto(comment);
  }

  /**
   * Find comments for a specific correction
   * @param correctionId Correction ID
   * @returns Array of comments for the correction
   */
  async findByCorrection(correctionId: string): Promise<CommentResponseDto[]> {
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
    const comments = await this.commentModel.find({ correctionId }).exec();
    return this.toResponseDtoList(comments);
  }

  /**
   * Update a comment
   * @param id Comment logical ID
   * @param updateCommentDto Data for updating the comment
   * @returns Updated comment
   */
  async update(
    id: string,
    updateCommentDto: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    // Vérifier que le commentaire existe et récupérer son document
    const comment = await this.findCommentEntity(id);
    
    // Mettre à jour le commentaire en utilisant l'ID logique
    const updatedComment = await this.commentModel
      .findOneAndUpdate({ id }, updateCommentDto, { new: true })
      .exec();
      
    if (!updatedComment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }
    
    return this.toResponseDto(updatedComment);
  }

  /**
   * Remove a comment
   * @param id Comment logical ID
   * @returns Removed comment
   */
  async remove(id: string): Promise<void> {
    // Vérifier que le commentaire existe
    await this.findCommentEntity(id);
    
    // Les vérifications d'accès sont maintenant gérées par le guard
    const deletedComment = await this.commentModel
      .findOneAndDelete({ id })
      .exec();
      
    if (!deletedComment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }
  }

  /**
   * Remove all comments for a correction
   * @param correctionId Correction ID
   */
  async removeByCorrection(correctionId: string): Promise<void> {
    // Les vérifications d'accès sont maintenant gérées par le guard
    await this.commentModel.deleteMany({ correctionId }).exec();
  }

  /**
   * Check if a user has teacher access to a correction
   * @param userEmail User Email
   * @param correctionId Correction ID
   * @returns Boolean indicating if the user has teacher access
   */
  async checkTeacherAccess(userEmail: string, correctionId: string): Promise<boolean> {
    try {
      // Get the correction
      const correction = await this.correctionService.findOne(correctionId);
      // Si l'utilisateur est l'enseignant qui a créé la correction, il a accès
      if (correction.correctedByEmail === userEmail) {
        return true;
      }
      // Vérifier si l'utilisateur est enseignant dans la classe associée
      const submission = await this.submissionService.findOne(correction.submissionId);
      const task = await this.taskService.findOne(submission.taskId);
      const isTeacher = await this.membershipService.checkMembershipRole(userEmail, task.classId, MembershipRole.TEACHER);
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
   * @param userEmail User Email
   * @param correctionId Correction ID
   * @returns Boolean indicating if the user has student access
   */
  async checkStudentAccess(userEmail: string, correctionId: string): Promise<boolean> {
    try {
      // Get the correction
      const correction = await this.correctionService.findOne(correctionId);
      // Vérifier si l'utilisateur est l'étudiant propriétaire de la soumission
      const submission = await this.submissionService.findOne(correction.submissionId);
      return submission.studentEmail === userEmail;
    } catch (error) {
      if (error instanceof NotFoundException) {
        return false;
      }
      throw error;
    }
  }

  // Pour l'utilisation interne uniquement - récupère l'entité Comment sans la convertir en DTO
  private async findCommentEntity(id: string): Promise<Comment & { _id: any }> {
    // Recherche uniquement par id logique
    const comment = await this.commentModel.findOne({ id }).exec();
    if (!comment) {
      throw new NotFoundException(`Comment with ID '${id}' not found`);
    }
    return comment;
  }
} 