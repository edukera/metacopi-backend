import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiBody, 
  ApiBearerAuth 
} from '@nestjs/swagger';
import { CommentService } from './comment.service';
import { Comment } from './comment.schema';
import { CreateCommentDto, UpdateCommentDto, CommentResponseDto } from './comment.dto';
import { CommentAccessGuard } from '../../common/guards';
import { AuthenticatedUser } from '../../common/decorators';

@ApiTags('comments')
@ApiBearerAuth()
@Controller('corrections/:id/comments')
@UseGuards(CommentAccessGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  @ApiOperation({ summary: 'Get all comments for a correction' })
  @ApiParam({ name: 'id', description: 'Correction ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'List of comments for the correction.', type: [CommentResponseDto] })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions.' })
  @ApiResponse({ status: 404, description: 'Correction not found.' })
  async findAll(@Param('id') correctionId: string): Promise<Comment[]> {
    return this.commentService.findByCorrection(correctionId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new comment for a correction' })
  @ApiParam({ name: 'id', description: 'Correction ID', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ type: CreateCommentDto })
  @ApiResponse({ status: 201, description: 'The comment has been successfully created.', type: CommentResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions.' })
  @ApiResponse({ status: 404, description: 'Correction not found.' })
  async create(
    @Param('id') correctionId: string,
    @Body() createCommentDto: CreateCommentDto
  ): Promise<Comment> {
    // Ensure the correctionId from the URL is used
    createCommentDto.correctionId = correctionId;
    return this.commentService.create(createCommentDto);
  }

  @Get(':commentId')
  @ApiOperation({ summary: 'Get a specific comment by ID' })
  @ApiParam({ name: 'id', description: 'Correction ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'commentId', description: 'Comment ID', example: '507f1f77bcf86cd799439012' })
  @ApiResponse({ status: 200, description: 'The found comment.', type: CommentResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions.' })
  @ApiResponse({ status: 404, description: 'Comment not found.' })
  async findOne(@Param('commentId') commentId: string): Promise<Comment> {
    return this.commentService.findOne(commentId);
  }

  @Patch(':commentId')
  @ApiOperation({ summary: 'Update a comment' })
  @ApiParam({ name: 'id', description: 'Correction ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'commentId', description: 'Comment ID', example: '507f1f77bcf86cd799439012' })
  @ApiBody({ type: UpdateCommentDto })
  @ApiResponse({ status: 200, description: 'The comment has been successfully updated.', type: CommentResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions.' })
  @ApiResponse({ status: 404, description: 'Comment not found.' })
  async update(
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto
  ): Promise<Comment> {
    return this.commentService.update(commentId, updateCommentDto);
  }

  @Delete(':commentId')
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'id', description: 'Correction ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'commentId', description: 'Comment ID', example: '507f1f77bcf86cd799439012' })
  @ApiResponse({ status: 204, description: 'The comment has been successfully deleted.' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions.' })
  @ApiResponse({ status: 404, description: 'Comment not found.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('commentId') commentId: string): Promise<void> {
    await this.commentService.remove(commentId);
  }
} 