import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { SubmissionService } from './submission.service';
import { CreateSubmissionDto, UpdateSubmissionDto } from './submission.dto';
import { Submission } from './submission.schema';
import { AdminOnly, AuthenticatedUser, RequirePermission } from '../../common/decorators';
import { Permission } from '../../common/permissions.enum';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('submissions')
@ApiBearerAuth()
@Controller('submissions')
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new submission' })
  @ApiBody({ type: CreateSubmissionDto })
  @ApiResponse({ status: 201, description: 'The submission has been successfully created.', type: Submission })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions.' })
  @AuthenticatedUser
  @RequirePermission(Permission.CREATE_SUBMISSIONS, 'create')
  async create(@Body() createSubmissionDto: CreateSubmissionDto): Promise<Submission> {
    return this.submissionService.create(createSubmissionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all submissions' })
  @ApiResponse({ status: 200, description: 'List of all submissions.', type: [Submission] })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions.' })
  @AdminOnly
  @RequirePermission(Permission.READ_SUBMISSIONS, 'list')
  async findAll(): Promise<Submission[]> {
    return this.submissionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a submission by ID' })
  @ApiParam({ name: 'id', description: 'Submission ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'The found submission.', type: Submission })
  @ApiResponse({ status: 404, description: 'Submission not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions.' })
  @AuthenticatedUser
  @RequirePermission(Permission.READ_SUBMISSIONS, 'read')
  async findOne(@Param('id') id: string): Promise<Submission> {
    return this.submissionService.findOne(id);
  }

  @Get('task/:taskId')
  @ApiOperation({ summary: 'Get all submissions for a specific task' })
  @ApiParam({ name: 'taskId', description: 'Task ID', example: '507f1f77bcf86cd799439012' })
  @ApiResponse({ status: 200, description: 'List of submissions for the specified task.', type: [Submission] })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions.' })
  @AuthenticatedUser
  @RequirePermission(Permission.READ_SUBMISSIONS, 'read')
  async findByTask(@Param('taskId') taskId: string): Promise<Submission[]> {
    return this.submissionService.findByTask(taskId);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get all submissions for a specific student' })
  @ApiParam({ name: 'studentId', description: 'Student ID', example: '507f1f77bcf86cd799439013' })
  @ApiResponse({ status: 200, description: 'List of submissions for the specified student.', type: [Submission] })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions.' })
  @AuthenticatedUser
  @RequirePermission(Permission.READ_SUBMISSIONS, 'read')
  async findByStudent(@Param('studentId') studentId: string): Promise<Submission[]> {
    return this.submissionService.findByStudent(studentId);
  }

  @Get('student/:studentId/task/:taskId')
  @ApiOperation({ summary: 'Get a submission for a specific student and task' })
  @ApiParam({ name: 'studentId', description: 'Student ID', example: '507f1f77bcf86cd799439013' })
  @ApiParam({ name: 'taskId', description: 'Task ID', example: '507f1f77bcf86cd799439012' })
  @ApiResponse({ status: 200, description: 'The found submission.', type: Submission })
  @ApiResponse({ status: 404, description: 'Submission not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions.' })
  @AuthenticatedUser
  @RequirePermission(Permission.READ_SUBMISSIONS, 'read')
  async findByStudentAndTask(
    @Param('studentId') studentId: string,
    @Param('taskId') taskId: string,
  ): Promise<Submission> {
    return this.submissionService.findByStudentAndTask(studentId, taskId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a submission' })
  @ApiParam({ name: 'id', description: 'Submission ID', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ type: UpdateSubmissionDto })
  @ApiResponse({ status: 200, description: 'The submission has been successfully updated.', type: Submission })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 404, description: 'Submission not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions.' })
  @AuthenticatedUser
  @RequirePermission(Permission.UPDATE_SUBMISSIONS, 'update')
  async update(
    @Param('id') id: string,
    @Body() updateSubmissionDto: UpdateSubmissionDto,
  ): Promise<Submission> {
    return this.submissionService.update(id, updateSubmissionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a submission' })
  @ApiParam({ name: 'id', description: 'Submission ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 204, description: 'The submission has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Submission not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions.' })
  @AdminOnly
  @RequirePermission(Permission.DELETE_SUBMISSIONS, 'delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.submissionService.remove(id);
  }
} 