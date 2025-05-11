import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  HttpCode, 
  HttpStatus, 
  UseGuards,
  ForbiddenException
} from '@nestjs/common';
import { AIAnnotationService } from './ai-annotation.service';
import { CreateAIAnnotationDto, UpdateAIAnnotationDto, AIAnnotationResponseDto } from './ai-annotation.dto';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiBody,
  ApiBearerAuth 
} from '@nestjs/swagger';
import { AuthenticatedUser } from '../../common/decorators';
import { AIAnnotationAccessGuard } from '../../common/guards/ai-annotation-access.guard';

@ApiTags('ai-annotations')
@ApiBearerAuth()
@Controller('corrections/:correctionId/ai-annotations')
@UseGuards(AIAnnotationAccessGuard)
@AuthenticatedUser
export class AIAnnotationController {
  constructor(private readonly aiAnnotationService: AIAnnotationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all AI annotations for a correction' })
  @ApiParam({ name: 'correctionId', description: 'Logical business ID of the correction', example: 'CORR-2024-001' })
  @ApiResponse({ status: 200, description: 'List of AI annotations for the correction', type: [AIAnnotationResponseDto] })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions or correction not found' })
  async findAll(@Param('correctionId') correctionId: string): Promise<AIAnnotationResponseDto[]> {
    return this.aiAnnotationService.findByCorrection(correctionId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new AI annotation for a correction' })
  @ApiParam({ name: 'correctionId', description: 'Logical business ID of the correction', example: 'CORR-2024-001' })
  @ApiBody({ type: CreateAIAnnotationDto })
  @ApiResponse({ status: 201, description: 'The AI annotation has been successfully created', type: AIAnnotationResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request body or JSON format' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions or correction not found' })
  async create(
    @Param('correctionId') correctionId: string,
    @Body() createAIAnnotationDto: CreateAIAnnotationDto,
  ): Promise<AIAnnotationResponseDto> {
    return this.aiAnnotationService.create({
      ...createAIAnnotationDto,
      correctionId,
    });
  }

  @Get(':aiAnnotationId')
  @ApiOperation({ summary: 'Get a specific AI annotation by its logical ID' })
  @ApiParam({ name: 'correctionId', description: 'Logical business ID of the correction', example: 'CORR-2024-001' })
  @ApiParam({ name: 'aiAnnotationId', description: 'Logical business ID of the AI annotation', example: 'AIANN-2024-001' })
  @ApiResponse({ status: 200, description: 'The AI annotation has been found', type: AIAnnotationResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'AI annotation not found' })
  async findOne(
    @Param('correctionId') correctionId: string,
    @Param('aiAnnotationId') aiAnnotationId: string
  ): Promise<AIAnnotationResponseDto> {
    const aiAnnotation = await this.aiAnnotationService.findById(aiAnnotationId);
    
    // Vérifier que l'annotation IA appartient bien à la correction
    if (aiAnnotation.correctionId !== correctionId) {
      throw new ForbiddenException(`AI annotation with ID ${aiAnnotationId} does not belong to correction with ID ${correctionId}`);
    }
    
    return aiAnnotation;
  }

  @Patch(':aiAnnotationId')
  @ApiOperation({ summary: 'Update an AI annotation by its logical ID' })
  @ApiParam({ name: 'correctionId', description: 'Logical business ID of the correction', example: 'CORR-2024-001' })
  @ApiParam({ name: 'aiAnnotationId', description: 'Logical business ID of the AI annotation', example: 'AIANN-2024-001' })
  @ApiBody({ type: UpdateAIAnnotationDto })
  @ApiResponse({ status: 200, description: 'The AI annotation has been successfully updated', type: AIAnnotationResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid JSON format in the value field' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions or AI annotation does not belong to correction' })
  @ApiResponse({ status: 404, description: 'AI annotation not found' })
  async update(
    @Param('correctionId') correctionId: string,
    @Param('aiAnnotationId') aiAnnotationId: string,
    @Body() updateAIAnnotationDto: UpdateAIAnnotationDto,
  ): Promise<AIAnnotationResponseDto> {
    // Récupérer d'abord l'annotation IA pour vérifier qu'elle appartient à la correction
    const aiAnnotation = await this.aiAnnotationService.findById(aiAnnotationId);
    
    // Vérifier que l'annotation IA appartient bien à la correction
    if (aiAnnotation.correctionId !== correctionId) {
      throw new ForbiddenException(`AI annotation with ID ${aiAnnotationId} does not belong to correction with ID ${correctionId}`);
    }
    
    return this.aiAnnotationService.update(aiAnnotationId, updateAIAnnotationDto);
  }

  @Delete(':aiAnnotationId')
  @ApiOperation({ summary: 'Delete an AI annotation by its logical ID' })
  @ApiParam({ name: 'correctionId', description: 'Logical business ID of the correction', example: 'CORR-2024-001' })
  @ApiParam({ name: 'aiAnnotationId', description: 'Logical business ID of the AI annotation', example: 'AIANN-2024-001' })
  @ApiResponse({ status: 204, description: 'The AI annotation has been successfully deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions or AI annotation does not belong to correction' })
  @ApiResponse({ status: 404, description: 'AI annotation not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('correctionId') correctionId: string,
    @Param('aiAnnotationId') aiAnnotationId: string,
  ): Promise<void> {
    // Récupérer d'abord l'annotation IA pour vérifier qu'elle appartient à la correction
    const aiAnnotation = await this.aiAnnotationService.findById(aiAnnotationId);
    
    // Vérifier que l'annotation IA appartient bien à la correction
    if (aiAnnotation.correctionId !== correctionId) {
      throw new ForbiddenException(`AI annotation with ID ${aiAnnotationId} does not belong to correction with ID ${correctionId}`);
    }
    
    await this.aiAnnotationService.remove(aiAnnotationId);
  }
} 