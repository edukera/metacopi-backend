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
  @AuthenticatedUser
  @UseGuards(JwtAuthGuard, CorrectionAccessGuard)
  @SetPermission(Permission.READ_CORRECTIONS, 'list')
  @ApiOperation({ summary: 'Get all corrections accessible to the current user' })
  @ApiResponse({ status: 200, description: 'Returns a list of corrections accessible to the current user.', type: [CorrectionResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions.' })
  async findAll(): Promise<CorrectionResponseDto[]> {
    return this.correctionService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, CorrectionAccessGuard)
  @SetPermission(Permission.READ_CORRECTIONS, 'read')
  @ApiOperation({ summary: 'Get a correction by ID', description: 'Retrieves the details of a specific correction by its logical business ID or MongoDB _id' })
  @ApiParam({ name: 'id', description: 'Logical business ID or MongoDB _id of the correction to retrieve', example: 'CORR-2024-001' })
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

  @Get('task/:taskId')
  @UseGuards(JwtAuthGuard, CorrectionAccessGuard)
  @SetPermission(Permission.READ_CORRECTIONS, 'read')
  @ApiOperation({ 
    summary: 'Get all corrections for a task',
    description: 'Retrieves all corrections associated with a specific task by finding all submissions for that task and returning their corresponding corrections.'
  })
  @ApiParam({ 
    name: 'taskId', 
    description: 'Logical business ID of the task to get corrections for', 
    example: 'TASK-2024-001' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns all corrections for the specified task. Returns an empty array if no submissions or corrections exist for the task.', 
    type: [CorrectionResponseDto] 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions.' })
  async findByTask(@Param('taskId') taskId: string): Promise<CorrectionResponseDto[]> {
    return this.correctionService.findByTask(taskId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, CorrectionAccessGuard)
  @SetPermission(Permission.UPDATE_CORRECTIONS, 'update')
  @ApiOperation({ summary: 'Update a correction', description: 'Updates a correction by its logical business ID or MongoDB _id' })
  @ApiParam({ name: 'id', description: 'Logical business ID or MongoDB _id of the correction to update', example: 'CORR-2024-001' })
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
  @ApiOperation({ summary: 'Delete a correction', description: 'Deletes a correction by its logical business ID or MongoDB _id' })
  @ApiParam({ name: 'id', description: 'Logical business ID or MongoDB _id of the correction to delete', example: 'CORR-2024-001' })
  @ApiResponse({ status: 204, description: 'The correction has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Correction not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin privileges.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.correctionService.remove(id);
  }
} 