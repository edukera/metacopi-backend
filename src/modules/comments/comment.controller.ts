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
  HttpStatus,
  ForbiddenException
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
@Controller('corrections/:correctionId/comments')
@UseGuards(CommentAccessGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  @ApiOperation({ summary: 'Get all comments for a correction' })
  @ApiParam({ name: 'correctionId', description: 'Logical business ID of the correction', example: 'CORR-2024-001' })
  @ApiResponse({ status: 200, description: 'List of comments for the correction.', type: [CommentResponseDto] })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions.' })
  @ApiResponse({ status: 404, description: 'Correction not found.' })
  async findAll(@Param('correctionId') correctionId: string): Promise<CommentResponseDto[]> {
    return this.commentService.findByCorrection(correctionId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new comment for a correction' })
  @ApiParam({ name: 'correctionId', description: 'Logical business ID of the correction', example: 'CORR-2024-001' })
  @ApiBody({ type: CreateCommentDto })
  @ApiResponse({ status: 201, description: 'The comment has been successfully created.', type: CommentResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions.' })
  @ApiResponse({ status: 404, description: 'Correction not found.' })
  async create(
    @Param('correctionId') correctionId: string,
    @Body() createCommentDto: CreateCommentDto
  ): Promise<CommentResponseDto> {
    return this.commentService.create({
      ...createCommentDto,
      correctionId,
    });
  }

  @Get(':commentId')
  @ApiOperation({ summary: 'Get a specific comment by its logical ID' })
  @ApiParam({ name: 'correctionId', description: 'Logical business ID of the correction', example: 'CORR-2024-001' })
  @ApiParam({ name: 'commentId', description: 'Logical business ID of the comment', example: 'COMM-2024-001' })
  @ApiResponse({ status: 200, description: 'The found comment.', type: CommentResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions.' })
  @ApiResponse({ status: 404, description: 'Comment not found.' })
  async findOne(@Param('commentId') commentId: string): Promise<CommentResponseDto> {
    return this.commentService.findOne(commentId);
  }

  @Patch(':commentId')
  @ApiOperation({ summary: 'Update a comment by its logical ID' })
  @ApiParam({ name: 'correctionId', description: 'Logical business ID of the correction', example: 'CORR-2024-001' })
  @ApiParam({ name: 'commentId', description: 'Logical business ID of the comment', example: 'COMM-2024-001' })
  @ApiBody({ type: UpdateCommentDto })
  @ApiResponse({ status: 200, description: 'The comment has been successfully updated.', type: CommentResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions.' })
  @ApiResponse({ status: 404, description: 'Comment not found.' })
  async update(
    @Param('correctionId') correctionId: string,
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto
  ): Promise<CommentResponseDto> {
    // Récupérer d'abord le commentaire pour vérifier qu'il appartient à la correction
    const comment = await this.commentService.findOne(commentId);
    
    // Vérifier que le commentaire appartient bien à la correction
    if (comment.correctionId !== correctionId) {
      throw new ForbiddenException(`Comment with ID ${commentId} does not belong to correction with ID ${correctionId}`);
    }
    
    return this.commentService.update(commentId, updateCommentDto);
  }

  @Delete(':commentId')
  @ApiOperation({ summary: 'Delete a comment by its logical ID' })
  @ApiParam({ name: 'correctionId', description: 'Logical business ID of the correction', example: 'CORR-2024-001' })
  @ApiParam({ name: 'commentId', description: 'Logical business ID of the comment', example: 'COMM-2024-001' })
  @ApiResponse({ status: 204, description: 'The comment has been successfully deleted.' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions.' })
  @ApiResponse({ status: 404, description: 'Comment not found.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('correctionId') correctionId: string,
    @Param('commentId') commentId: string
  ): Promise<void> {
    // Récupérer d'abord le commentaire pour vérifier qu'il appartient à la correction
    const comment = await this.commentService.findOne(commentId);
    
    // Vérifier que le commentaire appartient bien à la correction
    if (comment.correctionId !== correctionId) {
      throw new ForbiddenException(`Comment with ID ${commentId} does not belong to correction with ID ${correctionId}`);
    }
    
    await this.commentService.remove(commentId);
  }
} 