import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, NotFoundException, BadRequestException, UseGuards } from '@nestjs/common';
import { AnnotationService } from './annotation.service';
import { CreateAnnotationDto, UpdateAnnotationDto } from './annotation.dto';
import { Annotation } from './annotation.schema';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AdminOnly, AuthenticatedUser, RequirePermission } from '../../common/decorators';
import { Permission } from '../../common/permissions.enum';
import { AnnotationAccessGuard } from '../../common/guards';

@ApiTags('annotations')
@Controller()
export class AnnotationController {
  constructor(private readonly annotationService: AnnotationService) {}

  @Post('corrections/:correctionId/annotations')
  @ApiOperation({ summary: 'Create a new annotation for a correction' })
  @ApiParam({ name: 'correctionId', description: 'ID of the correction' })
  @ApiResponse({ status: 201, description: 'The annotation has been successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid request body or JSON format' })
  @ApiResponse({ status: 403, description: 'Not authorized to create annotations for this correction' })
  @ApiResponse({ status: 404, description: 'Correction not found' })
  @AuthenticatedUser
  @RequirePermission(Permission.CREATE_CORRECTIONS, 'create')
  async create(
    @Param('correctionId') correctionId: string,
    @Body() createAnnotationDto: CreateAnnotationDto,
  ): Promise<Annotation> {
    // Vérifier que l'ID de correction dans l'URL correspond à celui dans le DTO
    if (correctionId !== createAnnotationDto.correctionId) {
      throw new BadRequestException('Correction ID in URL does not match the one in request body');
    }

    // Vérifier les permissions d'accès du professeur
    await this.annotationService.verifyTeacherAccess(correctionId);

    return this.annotationService.create(createAnnotationDto);
  }

  @Get('corrections/:correctionId/annotations')
  @ApiOperation({ summary: 'Get all annotations for a correction' })
  @ApiParam({ name: 'correctionId', description: 'ID of the correction' })
  @ApiResponse({ status: 200, description: 'List of annotations for the correction' })
  @ApiResponse({ status: 404, description: 'Correction not found' })
  @AuthenticatedUser
  @UseGuards(AnnotationAccessGuard)
  async findByCorrection(@Param('correctionId') correctionId: string): Promise<Annotation[]> {
    return this.annotationService.findByCorrection(correctionId);
  }

  @Get('corrections/:correctionId/annotations/:id')
  @ApiOperation({ summary: 'Get a specific annotation by ID' })
  @ApiParam({ name: 'correctionId', description: 'ID of the correction' })
  @ApiParam({ name: 'id', description: 'ID of the annotation' })
  @ApiResponse({ status: 200, description: 'The annotation has been found' })
  @ApiResponse({ status: 404, description: 'Annotation not found' })
  @AuthenticatedUser
  @RequirePermission(Permission.READ_CORRECTIONS, 'read')
  async findOne(
    @Param('correctionId') correctionId: string,
    @Param('id') id: string,
  ): Promise<Annotation> {
    const annotation = await this.annotationService.findById(id);
    
    // Vérifier que l'annotation appartient bien à la correction spécifiée
    if (annotation.correctionId.toString() !== correctionId) {
      throw new NotFoundException('Annotation not found for the specified correction');
    }
    
    return annotation;
  }

  @Patch('corrections/:correctionId/annotations/:id')
  @ApiOperation({ summary: 'Update an annotation' })
  @ApiParam({ name: 'correctionId', description: 'ID of the correction' })
  @ApiParam({ name: 'id', description: 'ID of the annotation' })
  @ApiResponse({ status: 200, description: 'The annotation has been successfully updated' })
  @ApiResponse({ status: 400, description: 'Invalid JSON format in the value field' })
  @ApiResponse({ status: 403, description: 'Not authorized to update annotations for this correction' })
  @ApiResponse({ status: 404, description: 'Annotation not found' })
  @AuthenticatedUser
  @RequirePermission(Permission.UPDATE_CORRECTIONS, 'update')
  async update(
    @Param('correctionId') correctionId: string,
    @Param('id') id: string,
    @Body() updateAnnotationDto: UpdateAnnotationDto,
  ): Promise<Annotation> {
    const annotation = await this.annotationService.findById(id);
    
    // Vérifier que l'annotation appartient bien à la correction spécifiée
    if (annotation.correctionId.toString() !== correctionId) {
      throw new NotFoundException('Annotation not found for the specified correction');
    }
    
    // Vérifier les permissions d'accès du professeur
    await this.annotationService.verifyTeacherAccess(correctionId);
    
    return this.annotationService.update(id, updateAnnotationDto);
  }

  @Delete('corrections/:correctionId/annotations/:id')
  @ApiOperation({ summary: 'Delete an annotation' })
  @ApiParam({ name: 'correctionId', description: 'ID of the correction' })
  @ApiParam({ name: 'id', description: 'ID of the annotation' })
  @ApiResponse({ status: 204, description: 'The annotation has been successfully deleted' })
  @ApiResponse({ status: 403, description: 'Not authorized to delete annotations for this correction' })
  @ApiResponse({ status: 404, description: 'Annotation not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuthenticatedUser
  @RequirePermission(Permission.DELETE_CORRECTIONS, 'delete')
  async remove(
    @Param('correctionId') correctionId: string,
    @Param('id') id: string,
  ): Promise<void> {
    const annotation = await this.annotationService.findById(id);
    
    // Vérifier que l'annotation appartient bien à la correction spécifiée
    if (annotation.correctionId.toString() !== correctionId) {
      throw new NotFoundException('Annotation not found for the specified correction');
    }
    
    // Vérifier les permissions d'accès du professeur
    await this.annotationService.verifyTeacherAccess(correctionId);
    
    await this.annotationService.remove(id);
  }
} 