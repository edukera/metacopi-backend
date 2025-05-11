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
import { AnnotationService } from './annotation.service';
import { CreateAnnotationDto, CreateAnnotationWithCorrectionIdDto, UpdateAnnotationDto, AnnotationResponseDto } from './annotation.dto';
import { Annotation } from './annotation.schema';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiBody,
  ApiBearerAuth 
} from '@nestjs/swagger';
import { AuthenticatedUser } from '../../common/decorators';
import { AnnotationAccessGuard } from '../../common/guards';

@ApiTags('annotations')
@ApiBearerAuth()
@Controller('corrections/:correctionId/annotations')
@UseGuards(AnnotationAccessGuard)
@AuthenticatedUser
export class AnnotationController {
  constructor(private readonly annotationService: AnnotationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all annotations for a correction' })
  @ApiParam({ name: 'correctionId', description: 'Logical business ID of the correction', example: 'CORR-2024-001' })
  @ApiResponse({ status: 200, description: 'List of annotations for the correction', type: [AnnotationResponseDto] })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions.' })
  @ApiResponse({ status: 404, description: 'Correction not found' })
  async findAll(@Param('correctionId') correctionId: string): Promise<AnnotationResponseDto[]> {
    return this.annotationService.findByCorrection(correctionId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new annotation for a correction' })
  @ApiParam({ name: 'correctionId', description: 'Logical business ID of the correction', example: 'CORR-2024-001' })
  @ApiBody({ type: CreateAnnotationDto })
  @ApiResponse({ status: 201, description: 'The annotation has been successfully created', type: AnnotationResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request body or JSON format' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions.' })
  @ApiResponse({ status: 404, description: 'Correction not found' })
  async create(
    @Param('correctionId') correctionId: string,
    @Body() createAnnotationDto: CreateAnnotationDto,
  ): Promise<AnnotationResponseDto> {
    return this.annotationService.create({
      ...createAnnotationDto,
      correctionId,
    });
  }

  @Get(':annotationId')
  @ApiOperation({ summary: 'Get a specific annotation by its logical ID' })
  @ApiParam({ name: 'correctionId', description: 'Logical business ID of the correction', example: 'CORR-2024-001' })
  @ApiParam({ name: 'annotationId', description: 'Logical business ID of the annotation', example: 'ANN-2024-001' })
  @ApiResponse({ status: 200, description: 'The annotation has been found', type: AnnotationResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions.' })
  @ApiResponse({ status: 404, description: 'Annotation not found' })
  async findOne(@Param('annotationId') annotationId: string): Promise<AnnotationResponseDto> {
    return this.annotationService.findById(annotationId);
  }

  @Patch(':annotationId')
  @ApiOperation({ summary: 'Update an annotation by its logical ID' })
  @ApiParam({ name: 'correctionId', description: 'Logical business ID of the correction', example: 'CORR-2024-001' })
  @ApiParam({ name: 'annotationId', description: 'Logical business ID of the annotation', example: 'ANN-2024-001' })
  @ApiBody({ type: UpdateAnnotationDto })
  @ApiResponse({ status: 200, description: 'The annotation has been successfully updated', type: AnnotationResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid JSON format in the value field' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions.' })
  @ApiResponse({ status: 404, description: 'Annotation not found' })
  async update(
    @Param('correctionId') correctionId: string,
    @Param('annotationId') annotationId: string,
    @Body() updateAnnotationDto: UpdateAnnotationDto,
  ): Promise<AnnotationResponseDto> {
    // Récupérer d'abord l'annotation pour vérifier qu'elle appartient à la correction
    const annotation = await this.annotationService.findById(annotationId);
    
    // Vérifier que l'annotation appartient bien à la correction
    if (annotation.correctionId.toString() !== correctionId) {
      throw new ForbiddenException(`Annotation with ID ${annotationId} does not belong to correction with ID ${correctionId}`);
    }
    
    return this.annotationService.update(annotationId, updateAnnotationDto);
  }

  @Delete(':annotationId')
  @ApiOperation({ summary: 'Delete an annotation by its logical ID' })
  @ApiParam({ name: 'correctionId', description: 'Logical business ID of the correction', example: 'CORR-2024-001' })
  @ApiParam({ name: 'annotationId', description: 'Logical business ID of the annotation', example: 'ANN-2024-001' })
  @ApiResponse({ status: 204, description: 'The annotation has been successfully deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions.' })
  @ApiResponse({ status: 404, description: 'Annotation not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('correctionId') correctionId: string,
    @Param('annotationId') annotationId: string,
  ): Promise<void> {
    // Récupérer d'abord l'annotation pour vérifier qu'elle appartient à la correction
    const annotation = await this.annotationService.findById(annotationId);
    
    // Vérifier que l'annotation appartient bien à la correction
    if (annotation.correctionId.toString() !== correctionId) {
      throw new ForbiddenException(`Annotation with ID ${annotationId} does not belong to correction with ID ${correctionId}`);
    }
    
    await this.annotationService.remove(annotationId);
  }
} 