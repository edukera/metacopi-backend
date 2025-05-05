import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { Comment } from './comment.schema';
import { CreateCommentDto, UpdateCommentDto } from './comment.dto';
import { CorrectionService } from '../corrections/correction.service';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<Comment>,
    private correctionService: CorrectionService,
    @Inject(REQUEST) private request,
  ) {}

  /**
   * Create a new comment
   * @param createCommentDto Data for creating the comment
   * @returns Newly created comment
   */
  async create(createCommentDto: CreateCommentDto): Promise<Comment> {
    // If createdBy is not provided, use the current user
    if (!createCommentDto.createdBy) {
      createCommentDto.createdBy = this.request.user.sub;
    }

    // Check if the user has access to the correction
    const userId = this.request.user.sub;
    const hasAccess = await this.checkTeacherAccess(userId, createCommentDto.correctionId);
    
    if (!hasAccess) {
      throw new ForbiddenException(
        'You do not have permission to add comments to this correction',
      );
    }

    const newComment = new this.commentModel(createCommentDto);
    return newComment.save();
  }

  /**
   * Find all comments
   * @returns Array of all comments
   */
  async findAll(): Promise<Comment[]> {
    return this.commentModel.find().exec();
  }

  /**
   * Find a comment by ID
   * @param id Comment ID
   * @returns Comment if found
   */
  async findOne(id: string): Promise<Comment> {
    const comment = await this.commentModel.findById(id).exec();
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }
    
    // Check if the user has access to the comment
    const userId = this.request.user.sub;
    const hasTeacherAccess = await this.checkTeacherAccess(userId, comment.correctionId);
    const hasStudentAccess = await this.checkStudentAccess(userId, comment.correctionId);
    
    if (!hasTeacherAccess && !hasStudentAccess) {
      throw new ForbiddenException(
        'You do not have permission to view this comment',
      );
    }
    
    return comment;
  }

  /**
   * Find comments for a specific correction
   * @param correctionId Correction ID
   * @returns Array of comments for the correction
   */
  async findByCorrection(correctionId: string): Promise<Comment[]> {
    // Check if the correction exists
    try {
      await this.correctionService.findOne(correctionId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`Correction with ID ${correctionId} not found`);
      }
      throw error;
    }
    
    // Check if the user has access to the correction
    const userId = this.request.user.sub;
    const hasTeacherAccess = await this.checkTeacherAccess(userId, correctionId);
    const hasStudentAccess = await this.checkStudentAccess(userId, correctionId);
    
    if (!hasTeacherAccess && !hasStudentAccess) {
      throw new ForbiddenException(
        'You do not have permission to view comments for this correction',
      );
    }
    
    return this.commentModel.find({ correctionId }).exec();
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
  ): Promise<Comment> {
    const comment = await this.findOne(id);
    
    // Only teachers and the creator of the comment can update it
    const userId = this.request.user.sub;
    const hasTeacherAccess = await this.checkTeacherAccess(userId, comment.correctionId);
    const isCreator = comment.createdBy === userId;
    
    if (!hasTeacherAccess && !isCreator) {
      throw new ForbiddenException(
        'You do not have permission to update this comment',
      );
    }
    
    const updatedComment = await this.commentModel
      .findByIdAndUpdate(id, updateCommentDto, { new: true })
      .exec();
      
    if (!updatedComment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }
    
    return updatedComment;
  }

  /**
   * Remove a comment
   * @param id Comment ID
   * @returns Removed comment
   */
  async remove(id: string): Promise<Comment> {
    const comment = await this.findOne(id);
    
    // Only teachers and the creator of the comment can delete it
    const userId = this.request.user.sub;
    const hasTeacherAccess = await this.checkTeacherAccess(userId, comment.correctionId);
    const isCreator = comment.createdBy === userId;
    
    if (!hasTeacherAccess && !isCreator) {
      throw new ForbiddenException(
        'You do not have permission to delete this comment',
      );
    }
    
    const deletedComment = await this.commentModel
      .findByIdAndDelete(id)
      .exec();
      
    if (!deletedComment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }
    
    return deletedComment;
  }

  /**
   * Remove all comments for a correction
   * @param correctionId Correction ID
   */
  async removeByCorrection(correctionId: string): Promise<void> {
    // Check if user has teacher access to the correction
    const userId = this.request.user.sub;
    const hasTeacherAccess = await this.checkTeacherAccess(userId, correctionId);
    
    if (!hasTeacherAccess) {
      throw new ForbiddenException(
        'You do not have permission to delete comments for this correction',
      );
    }
    
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
      
      // If the user is the teacher who created the correction, they have access
      if (correction.correctedById === userId) {
        return true;
      }
      
      // Here you would check if the user is a teacher in the class associated with the correction
      // This would require integrating with the class/membership service
      // For now, we'll just check if the user is the corrector
      
      return false;
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
      
      // The student access should be determined by checking if the user is the owner of the submission
      // This would require integrating with the submission service to check ownership
      // For now, we'll just implement a placeholder logic
      
      // Note: In a real implementation, you would query the submission service
      // to see if the userId matches the studentId of the submission with ID correction.submissionId
      
      // Placeholder: return false to indicate that the student doesn't have access
      return false;
    } catch (error) {
      if (error instanceof NotFoundException) {
        return false;
      }
      throw error;
    }
  }
} 