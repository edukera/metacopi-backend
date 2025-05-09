import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { CorrectionService } from './correction.service';
import { CreateCorrectionDto, UpdateCorrectionDto, CorrectionResponseDto } from './correction.dto';
import { Correction } from './correction.schema';
import { AdminOnly, AuthenticatedUser, SetPermission } from '../../common/decorators';
import { Permission } from '../../common/permissions.enum';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard, CorrectionAccessGuard } from '../../common/guards';

@ApiTags('corrections')
@Controller('corrections')
export class CorrectionController {
  constructor(private readonly correctionService: CorrectionService) {}

  @Post()
  @AuthenticatedUser
  @UseGuards(JwtAuthGuard, CorrectionAccessGuard)
  @SetPermission(Permission.CREATE_CORRECTIONS, 'create')
  @ApiOperation({ summary: 'Create a new correction' })
  @ApiBody({ type: CreateCorrectionDto })
  @ApiResponse({ status: 201, description: 'The correction has been successfully created.', type: CorrectionResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async create(@Body() createCorrectionDto: CreateCorrectionDto): Promise<CorrectionResponseDto> {
    return this.correctionService.create(createCorrectionDto);
  }

  @Get()
  @AdminOnly
  @UseGuards(JwtAuthGuard, CorrectionAccessGuard)
  @SetPermission(Permission.READ_CORRECTIONS, 'list')
  @ApiOperation({ summary: 'Get all corrections' })
  @ApiResponse({ status: 200, description: 'Returns a list of all corrections.', type: [CorrectionResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin privileges.' })
  async findAll(): Promise<CorrectionResponseDto[]> {
    return this.correctionService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, CorrectionAccessGuard)
  @SetPermission(Permission.READ_CORRECTIONS, 'read')
  @ApiOperation({ summary: 'Get a correction by ID' })
  @ApiParam({ name: 'id', description: 'Correction ID' })
  @ApiResponse({ status: 200, description: 'Returns the specified correction.', type: CorrectionResponseDto })
  @ApiResponse({ status: 404, description: 'Correction not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findOne(@Param('id') id: string): Promise<CorrectionResponseDto> {
    return this.correctionService.findOne(id);
  }

  @Get('submission/:submissionId')
  @UseGuards(JwtAuthGuard, CorrectionAccessGuard)
  @SetPermission(Permission.READ_CORRECTIONS, 'read')
  @ApiOperation({ summary: 'Get correction for a submission' })
  @ApiParam({ name: 'submissionId', description: 'ID of the submission' })
  @ApiResponse({ status: 200, description: 'Returns the correction for the specified submission.', type: CorrectionResponseDto })
  @ApiResponse({ status: 404, description: 'Correction not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findBySubmission(@Param('submissionId') submissionId: string): Promise<CorrectionResponseDto> {
    return this.correctionService.findBySubmission(submissionId);
  }

  @Get('teacher/:teacherId')
  @UseGuards(JwtAuthGuard, CorrectionAccessGuard)
  @SetPermission(Permission.READ_CORRECTIONS, 'read')
  @ApiOperation({ summary: 'Get all corrections by a teacher' })
  @ApiParam({ name: 'teacherId', description: 'ID of the teacher' })
  @ApiResponse({ status: 200, description: 'Returns all corrections by the specified teacher.', type: [CorrectionResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findByTeacher(@Param('teacherId') teacherId: string): Promise<CorrectionResponseDto[]> {
    return this.correctionService.findByTeacher(teacherId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, CorrectionAccessGuard)
  @SetPermission(Permission.UPDATE_CORRECTIONS, 'update')
  @ApiOperation({ summary: 'Update a correction' })
  @ApiParam({ name: 'id', description: 'Correction ID' })
  @ApiBody({ type: UpdateCorrectionDto })
  @ApiResponse({ status: 200, description: 'The correction has been successfully updated.', type: CorrectionResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request.' })
  @ApiResponse({ status: 404, description: 'Correction not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async update(
    @Param('id') id: string,
    @Body() updateCorrectionDto: UpdateCorrectionDto,
  ): Promise<CorrectionResponseDto> {
    return this.correctionService.update(id, updateCorrectionDto);
  }

  @Delete(':id')
  @AdminOnly
  @UseGuards(JwtAuthGuard, CorrectionAccessGuard)
  @SetPermission(Permission.DELETE_CORRECTIONS, 'delete')
  @ApiOperation({ summary: 'Delete a correction' })
  @ApiParam({ name: 'id', description: 'Correction ID' })
  @ApiResponse({ status: 204, description: 'The correction has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Correction not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin privileges.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.correctionService.remove(id);
  }
} 