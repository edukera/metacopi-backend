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
import { AICommentService } from './ai-comment.service';
import { AIComment } from './ai-comment.schema';
import { CreateAICommentDto, UpdateAICommentDto, AICommentResponseDto } from './ai-comment.dto';
import { AICommentAccessGuard } from '../../common/guards';
import { AuthenticatedUser } from '../../common/decorators';

@ApiTags('ai-comments')
@ApiBearerAuth()
@Controller('corrections/:correctionId/ai-comments')
@UseGuards(AICommentAccessGuard)
@AuthenticatedUser
export class AICommentController {
  constructor(private readonly aiCommentService: AICommentService) {}

  @Get()
  @ApiOperation({ summary: 'Get all AI comments for a correction' })
  @ApiParam({ name: 'correctionId', description: 'Logical business ID of the correction', example: 'CORR-2024-001' })
  @ApiResponse({ status: 200, description: 'List of AI comments for the correction.', type: [AICommentResponseDto] })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions or correction not found' })
  async findAll(@Param('correctionId') correctionId: string): Promise<AICommentResponseDto[]> {
    return this.aiCommentService.findByCorrection(correctionId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new AI comment for a correction' })
  @ApiParam({ name: 'correctionId', description: 'Logical business ID of the correction', example: 'CORR-2024-001' })
  @ApiBody({ type: CreateAICommentDto })
  @ApiResponse({ status: 201, description: 'The AI comment has been successfully created.', type: AICommentResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions or correction not found' })
  async create(
    @Param('correctionId') correctionId: string,
    @Body() createAICommentDto: CreateAICommentDto
  ): Promise<AICommentResponseDto> {
    return this.aiCommentService.create({
      ...createAICommentDto,
      correctionId,
    });
  }

  @Get(':aiCommentId')
  @ApiOperation({ summary: 'Get a specific AI comment by its logical ID' })
  @ApiParam({ name: 'correctionId', description: 'Logical business ID of the correction', example: 'CORR-2024-001' })
  @ApiParam({ name: 'aiCommentId', description: 'Logical business ID of the AI comment', example: 'AIC-2024-001' })
  @ApiResponse({ status: 200, description: 'The found AI comment.', type: AICommentResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions or AI comment does not belong to correction' })
  @ApiResponse({ status: 404, description: 'AI Comment not found.' })
  async findOne(
    @Param('correctionId') correctionId: string,
    @Param('aiCommentId') aiCommentId: string
  ): Promise<AICommentResponseDto> {
    const aiComment = await this.aiCommentService.findOne(aiCommentId);
    
    // Vérifier que le commentaire IA appartient bien à la correction
    if (aiComment.correctionId !== correctionId) {
      throw new ForbiddenException(`AI comment with ID ${aiCommentId} does not belong to correction with ID ${correctionId}`);
    }
    
    return aiComment;
  }

  @Patch(':aiCommentId')
  @ApiOperation({ summary: 'Update an AI comment by its logical ID' })
  @ApiParam({ name: 'correctionId', description: 'Logical business ID of the correction', example: 'CORR-2024-001' })
  @ApiParam({ name: 'aiCommentId', description: 'Logical business ID of the AI comment', example: 'AIC-2024-001' })
  @ApiBody({ type: UpdateAICommentDto })
  @ApiResponse({ status: 200, description: 'The AI comment has been successfully updated.', type: AICommentResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions or AI comment does not belong to correction' })
  @ApiResponse({ status: 404, description: 'AI Comment not found.' })
  async update(
    @Param('correctionId') correctionId: string,
    @Param('aiCommentId') aiCommentId: string,
    @Body() updateAICommentDto: UpdateAICommentDto
  ): Promise<AICommentResponseDto> {
    // Récupérer d'abord le commentaire IA pour vérifier qu'il appartient à la correction
    const aiComment = await this.aiCommentService.findOne(aiCommentId);
    
    // Vérifier que le commentaire IA appartient bien à la correction
    if (aiComment.correctionId !== correctionId) {
      throw new ForbiddenException(`AI comment with ID ${aiCommentId} does not belong to correction with ID ${correctionId}`);
    }
    
    return this.aiCommentService.update(aiCommentId, updateAICommentDto);
  }

  @Delete(':aiCommentId')
  @ApiOperation({ summary: 'Delete an AI comment by its logical ID' })
  @ApiParam({ name: 'correctionId', description: 'Logical business ID of the correction', example: 'CORR-2024-001' })
  @ApiParam({ name: 'aiCommentId', description: 'Logical business ID of the AI comment', example: 'AIC-2024-001' })
  @ApiResponse({ status: 204, description: 'The AI comment has been successfully deleted.' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions or AI comment does not belong to correction' })
  @ApiResponse({ status: 404, description: 'AI Comment not found.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('correctionId') correctionId: string,
    @Param('aiCommentId') aiCommentId: string
  ): Promise<void> {
    // Récupérer d'abord le commentaire IA pour vérifier qu'il appartient à la correction
    const aiComment = await this.aiCommentService.findOne(aiCommentId);
    
    // Vérifier que le commentaire IA appartient bien à la correction
    if (aiComment.correctionId !== correctionId) {
      throw new ForbiddenException(`AI comment with ID ${aiCommentId} does not belong to correction with ID ${correctionId}`);
    }
    
    await this.aiCommentService.remove(aiCommentId);
  }
} 