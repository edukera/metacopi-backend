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
import { AICommentService } from './ai-comment.service';
import { AIComment } from './ai-comment.schema';
import { CreateAICommentDto, UpdateAICommentDto, AICommentResponseDto } from './ai-comment.dto';
import { AICommentAccessGuard } from '../../common/guards';
import { AuthenticatedUser } from '../../common/decorators';

@ApiTags('ai-comments')
@ApiBearerAuth()
@Controller('corrections/:id/ai-comments')
@UseGuards(AICommentAccessGuard)
export class AICommentController {
  constructor(private readonly aiCommentService: AICommentService) {}

  @Get()
  @ApiOperation({ summary: 'Get all AI comments for a correction' })
  @ApiParam({ name: 'id', description: 'Correction ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'List of AI comments for the correction.', type: [AICommentResponseDto] })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions.' })
  @ApiResponse({ status: 404, description: 'Correction not found.' })
  async findAll(@Param('id') correctionId: string): Promise<AICommentResponseDto[]> {
    return this.aiCommentService.findByCorrection(correctionId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new AI comment for a correction' })
  @ApiParam({ name: 'id', description: 'Correction ID', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ type: CreateAICommentDto })
  @ApiResponse({ status: 201, description: 'The AI comment has been successfully created.', type: AICommentResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions.' })
  @ApiResponse({ status: 404, description: 'Correction not found.' })
  async create(
    @Param('id') correctionId: string,
    @Body() createAICommentDto: CreateAICommentDto
  ): Promise<AICommentResponseDto> {
    // Ensure the correctionId from the URL is used
    createAICommentDto.correctionId = correctionId;
    return this.aiCommentService.create(createAICommentDto);
  }

  @Get(':aiCommentId')
  @ApiOperation({ summary: 'Get a specific AI comment by ID' })
  @ApiParam({ name: 'id', description: 'Correction ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'aiCommentId', description: 'AI Comment ID', example: '507f1f77bcf86cd799439012' })
  @ApiResponse({ status: 200, description: 'The found AI comment.', type: AICommentResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions.' })
  @ApiResponse({ status: 404, description: 'AI Comment not found.' })
  async findOne(@Param('aiCommentId') aiCommentId: string): Promise<AICommentResponseDto> {
    return this.aiCommentService.findOne(aiCommentId);
  }

  @Patch(':aiCommentId')
  @ApiOperation({ summary: 'Update an AI comment' })
  @ApiParam({ name: 'id', description: 'Correction ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'aiCommentId', description: 'AI Comment ID', example: '507f1f77bcf86cd799439012' })
  @ApiBody({ type: UpdateAICommentDto })
  @ApiResponse({ status: 200, description: 'The AI comment has been successfully updated.', type: AICommentResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions.' })
  @ApiResponse({ status: 404, description: 'AI Comment not found.' })
  async update(
    @Param('aiCommentId') aiCommentId: string,
    @Body() updateAICommentDto: UpdateAICommentDto
  ): Promise<AICommentResponseDto> {
    return this.aiCommentService.update(aiCommentId, updateAICommentDto);
  }

  @Delete(':aiCommentId')
  @ApiOperation({ summary: 'Delete an AI comment' })
  @ApiParam({ name: 'id', description: 'Correction ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'aiCommentId', description: 'AI Comment ID', example: '507f1f77bcf86cd799439012' })
  @ApiResponse({ status: 204, description: 'The AI comment has been successfully deleted.' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions.' })
  @ApiResponse({ status: 404, description: 'AI Comment not found.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('aiCommentId') aiCommentId: string): Promise<void> {
    await this.aiCommentService.remove(aiCommentId);
  }
} 