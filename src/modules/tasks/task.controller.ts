import { Controller, Get, Post, Body, Param, Patch, Delete, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto, TaskResponseDto } from './task.dto';
import { Task } from './task.schema';
import { AuthenticatedUser } from '../../common/decorators';
import { CheckPermission } from '../../common/guards/permission.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('tasks')
@ApiBearerAuth('JWT-auth')
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tasks' })
  @ApiResponse({ status: 200, description: 'Returns a list of all tasks.', type: [TaskResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @AuthenticatedUser
  @CheckPermission('Task', 'list')
  async findAll(@Query('classId') classId?: string): Promise<TaskResponseDto[]> {
    if (classId) {
      return this.taskService.findByClass(classId);
    }
    return this.taskService.findAll();
  }

  @Get('my-tasks')
  @ApiOperation({ summary: 'Get current user\'s tasks' })
  @ApiResponse({ status: 200, description: 'Returns the list of user\'s tasks.', type: [TaskResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @AuthenticatedUser
  @CheckPermission('Task', 'read')
  async findMyTasks(): Promise<TaskResponseDto[]> {
    return this.taskService.findTasksForUser();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task by ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Returns the specified task.', type: TaskResponseDto })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @AuthenticatedUser
  @CheckPermission('Task', 'read')
  async findOne(@Param('id') id: string): Promise<TaskResponseDto> {
    return this.taskService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'The task has been successfully created.', type: TaskResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @AuthenticatedUser
  @CheckPermission('Task', 'create')
  async create(@Body() createTaskDto: CreateTaskDto): Promise<TaskResponseDto> {
    return this.taskService.create(createTaskDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'The task has been successfully updated.', type: TaskResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @AuthenticatedUser
  @CheckPermission('Task', 'update')
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    return this.taskService.update(id, updateTaskDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'The task has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @AuthenticatedUser
  @CheckPermission('Task', 'delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.taskService.remove(id);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'The task has been successfully archived.', type: TaskResponseDto })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @AuthenticatedUser
  @CheckPermission('Task', 'archive')
  async archive(@Param('id') id: string): Promise<TaskResponseDto> {
    return this.taskService.archive(id);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: 'Publish a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'The task has been successfully published.', type: TaskResponseDto })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @AuthenticatedUser
  @CheckPermission('Task', 'publish')
  async publish(@Param('id') id: string): Promise<TaskResponseDto> {
    return this.taskService.publish(id);
  }
} 