import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, NotFoundException, BadRequestException, UseGuards } from '@nestjs/common';
import { AIAnnotationService as AIAnnotationService } from './ai-annotation.service';
import { CreateAIAnnotationDto, UpdateAIAnnotationDto as UpdateAIAnnotationDto, AIAnnotationResponseDto as AIAnnotationResponseDto } from './ai-annotation.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AdminOnly, AuthenticatedUser, RequirePermission } from '../../common/decorators';
import { Permission } from '../../common/permissions.enum';

@ApiTags('ai-annotations')
@Controller()
export class AIAnnotationController {
  constructor(private readonly aiAnnotationService: AIAnnotationService) {}

  @Post('corrections/:correctionId/ai-annotations')
  @ApiOperation({ summary: 'Create a new AI annotation for a correction' })
  @ApiParam({ name: 'correctionId', description: 'Logical business ID of the correction', example: 'CORR-2024-001' })
  @ApiResponse({ status: 201, description: 'The AI annotation has been successfully created', type: AIAnnotationResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request body or JSON format' })
  @ApiResponse({ status: 404, description: 'Correction not found' })
  @AuthenticatedUser
  async create(
    @Param('correctionId') correctionId: string,
    @Body() createAIAnnotationDto: CreateAIAnnotationDto,
  ): Promise<AIAnnotationResponseDto> {
    // Vérifier que l'ID de correction dans l'URL correspond à celui dans le DTO
    if (correctionId !== createAIAnnotationDto.correctionId) {
      throw new BadRequestException('Correction ID in URL does not match the one in request body');
    }
    return this.aiAnnotationService.create(createAIAnnotationDto);
  }

  @Get('corrections/:correctionId/ai-annotations')
  @ApiOperation({ summary: 'Get all AI annotations for a correction' })
  @ApiParam({ name: 'correctionId', description: 'Logical business ID of the correction', example: 'CORR-2024-001' })
  @ApiResponse({ status: 200, description: 'List of AI annotations for the correction', type: [AIAnnotationResponseDto] })
  @ApiResponse({ status: 404, description: 'Correction not found' })
  @AuthenticatedUser
  async findByCorrection(@Param('correctionId') correctionId: string): Promise<AIAnnotationResponseDto[]> {
    return this.aiAnnotationService.findByCorrection(correctionId);
  }

  @Get('corrections/:correctionId/ai-annotations/:id')
  @ApiOperation({ summary: 'Get a specific AI annotation by ID (logical or MongoDB)' })
  @ApiParam({ name: 'correctionId', description: 'Logical business ID of the correction', example: 'CORR-2024-001' })
  @ApiParam({ name: 'id', description: 'AI annotation logical ID or MongoDB ID', example: 'AIANN-2024-001' })
  @ApiResponse({ status: 200, description: 'The AI annotation has been found', type: AIAnnotationResponseDto })
  @ApiResponse({ status: 404, description: 'AI annotation not found' })
  @AuthenticatedUser
  async findOne(
    @Param('correctionId') correctionId: string,
    @Param('id') id: string,
  ): Promise<AIAnnotationResponseDto> {
    const aiAnnotation = await this.aiAnnotationService.findById(id);
    if (aiAnnotation.correctionId.toString() !== correctionId) {
      throw new NotFoundException('AI annotation not found for the specified correction');
    }
    return aiAnnotation;
  }

  @Patch('corrections/:correctionId/ai-annotations/:id')
  @ApiOperation({ summary: 'Update an AI annotation (by logical or MongoDB ID)' })
  @ApiParam({ name: 'correctionId', description: 'Logical business ID of the correction', example: 'CORR-2024-001' })
  @ApiParam({ name: 'id', description: 'AI annotation logical ID or MongoDB ID', example: 'AIANN-2024-001' })
  @ApiResponse({ status: 200, description: 'The AI annotation has been successfully updated', type: AIAnnotationResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid JSON format in the value field' })
  @ApiResponse({ status: 404, description: 'AI annotation not found' })
  @AuthenticatedUser
  async update(
    @Param('correctionId') correctionId: string,
    @Param('id') id: string,
    @Body() updateAIAnnotationDto: UpdateAIAnnotationDto,
  ): Promise<AIAnnotationResponseDto> {
    const aiAnnotation = await this.aiAnnotationService.findById(id);
    if (aiAnnotation.correctionId.toString() !== correctionId) {
      throw new NotFoundException('AI annotation not found for the specified correction');
    }
    return this.aiAnnotationService.update(id, updateAIAnnotationDto);
  }

  @Delete('corrections/:correctionId/ai-annotations/:id')
  @ApiOperation({ summary: 'Delete an AI annotation (by logical or MongoDB ID)' })
  @ApiParam({ name: 'correctionId', description: 'Logical business ID of the correction', example: 'CORR-2024-001' })
  @ApiParam({ name: 'id', description: 'AI annotation logical ID or MongoDB ID', example: 'AIANN-2024-001' })
  @ApiResponse({ status: 204, description: 'The AI annotation has been successfully deleted' })
  @ApiResponse({ status: 404, description: 'AI annotation not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuthenticatedUser
  async remove(
    @Param('correctionId') correctionId: string,
    @Param('id') id: string,
  ): Promise<void> {
    const aiAnnotation = await this.aiAnnotationService.findById(id);
    if (aiAnnotation.correctionId.toString() !== correctionId) {
      throw new NotFoundException('AI annotation not found for the specified correction');
    }
    await this.aiAnnotationService.remove(id);
  }
} 