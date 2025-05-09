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
    const commentDto = new CommentResponseDto();
    commentDto.id = comment['_id'].toString();
    commentDto.correctionId = comment.correctionId?.toString();
    commentDto.pageNumber = comment.pageNumber;
    commentDto.pageY = comment.pageY;
    commentDto.type = comment.type || 'note';
    commentDto.color = comment.color || '#FFD700';
    commentDto.markdown = comment.isMarkdown || false;
    commentDto.text = comment.text;
    commentDto.annotations = comment.annotations || [];
    commentDto.createdBy = comment.createdBy?.toString();
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
   * @param createCommentDto Data for creating the comment
   * @returns Newly created comment
   */
  async create(createCommentDto: CreateCommentDto): Promise<CommentResponseDto> {
    // If createdBy is not provided, use the current user
    if (!createCommentDto.createdBy) {
      createCommentDto.createdBy = this.request.user.sub;
    }

    // Les vérifications d'accès sont maintenant gérées par le guard
    const newComment = new this.commentModel(createCommentDto);
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
   * Find a comment by ID
   * @param id Comment ID
   * @returns Comment if found
   */
  async findOne(id: string): Promise<CommentResponseDto> {
    const comment = await this.commentModel.findById(id).exec();
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }
    
    // Les vérifications d'accès sont maintenant gérées par le guard
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
   * @param id Comment ID
   * @param updateCommentDto Data for updating the comment
   * @returns Updated comment
   */
  async update(
    id: string,
    updateCommentDto: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    // Vérifier que le commentaire existe
    await this.findCommentEntity(id);
    
    // Les vérifications d'accès sont maintenant gérées par le guard
    const updatedComment = await this.commentModel
      .findByIdAndUpdate(id, updateCommentDto, { new: true })
      .exec();
      
    if (!updatedComment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }
    
    return this.toResponseDto(updatedComment);
  }

  /**
   * Remove a comment
   * @param id Comment ID
   * @returns Removed comment
   */
  async remove(id: string): Promise<void> {
    // Vérifier que le commentaire existe
    await this.findCommentEntity(id);
    
    // Les vérifications d'accès sont maintenant gérées par le guard
    const deletedComment = await this.commentModel
      .findByIdAndDelete(id)
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
   * @param userId User ID
   * @param correctionId Correction ID
   * @returns Boolean indicating if the user has teacher access
   */
  async checkTeacherAccess(userId: string, correctionId: string): Promise<boolean> {
    try {
      // Get the correction
      const correction = await this.correctionService.findOne(correctionId);
      
      // Si l'utilisateur est l'enseignant qui a créé la correction, il a accès
      if (correction.correctedById === userId) {
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
      
      return submission.studentId === userId;
    } catch (error) {
      if (error instanceof NotFoundException) {
        return false;
      }
      throw error;
    }
  }

  // Pour l'utilisation interne uniquement - récupère l'entité Comment sans la convertir en DTO
  private async findCommentEntity(id: string): Promise<Comment> {
    const comment = await this.commentModel.findById(id).exec();
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }
    return comment;
  }
} 