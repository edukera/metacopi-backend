import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { CommentService } from '../../modules/comments/comment.service';
import { Request } from 'express';

@Injectable()
export class CommentAccessGuard implements CanActivate {
  constructor(private readonly commentService: CommentService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;
    
    // If no user is authenticated, deny access
    if (!user) {
      throw new ForbiddenException('User is not authenticated');
    }
    
    const userId = user['sub'] || user['id'];
    const method = request.method;
    
    // Extract correctionId and commentId from request parameters or body
    let correctionId: string;
    let commentId: string;
    
    // For routes like /corrections/:id/comments/:commentId
    if (request.params.id) {
      correctionId = request.params.id;
    } 
    // For routes that have correctionId in the body (POST requests)
    else if (request.body && request.body.correctionId) {
      correctionId = request.body.correctionId;
    }
    
    // For routes that have commentId parameter
    if (request.params.commentId) {
      commentId = request.params.commentId;
    }
    
    // If no correctionId or commentId found, deny access
    if (!correctionId && !commentId) {
      throw new ForbiddenException('Missing correction or comment identifier');
    }
    
    // If we have a commentId but no correctionId, fetch the comment to get its correctionId
    if (commentId && !correctionId) {
      try {
        const comment = await this.commentService.findOne(commentId);
        correctionId = comment.correctionId;
      } catch (error) {
        throw new ForbiddenException('Cannot determine correction for this comment');
      }
    }
    
    // Check teacher access
    const hasTeacherAccess = await this.commentService.checkTeacherAccess(userId, correctionId);
    
    // For GET requests, also check student access
    if (method === 'GET') {
      const hasStudentAccess = await this.commentService.checkStudentAccess(userId, correctionId);
      
      // If user has either teacher or student access for GET requests, allow access
      if (hasTeacherAccess || hasStudentAccess) {
        return true;
      }
    } 
    // For non-GET requests (POST, PATCH, DELETE), only teachers can proceed
    else if (hasTeacherAccess) {
      return true;
    }
    
    // If none of the conditions were met, deny access
    throw new ForbiddenException(
      'You do not have permission to access this resource',
    );
  }
} 