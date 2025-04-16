import { Controller, Get, Post, Body, Param, Patch, Delete, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { TaskResourceService } from './task-resource.service';
import { CreateTaskResourceDto, UpdateTaskResourceDto } from './task-resource.dto';
import { TaskResource } from './task-resource.schema';
import { AuthenticatedUser } from '../../common/decorators';
import { CheckPermission } from '../../common/guards/permission.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('task-resources')
@Controller('task-resources')
export class TaskResourceController {
  constructor(private readonly taskResourceService: TaskResourceService) {}

  @Get()
  @AuthenticatedUser
  @CheckPermission('TaskResource', 'list')
  async findAll(): Promise<TaskResource[]> {
    return this.taskResourceService.findAll();
  }

  @Get('task/:taskId')
  @AuthenticatedUser
  @CheckPermission('TaskResource', 'read')
  async findByTask(@Param('taskId') taskId: string): Promise<TaskResource[]> {
    return this.taskResourceService.findByTask(taskId);
  }

  @Get(':id')
  @AuthenticatedUser
  @CheckPermission('TaskResource', 'read')
  async findOne(@Param('id') id: string): Promise<TaskResource> {
    return this.taskResourceService.findOne(id);
  }

  @Post()
  @AuthenticatedUser
  @CheckPermission('TaskResource', 'create')
  async create(@Body() createTaskResourceDto: CreateTaskResourceDto): Promise<TaskResource> {
    return this.taskResourceService.create(createTaskResourceDto);
  }

  @Patch(':id')
  @AuthenticatedUser
  @CheckPermission('TaskResource', 'update')
  async update(
    @Param('id') id: string,
    @Body() updateTaskResourceDto: UpdateTaskResourceDto,
  ): Promise<TaskResource> {
    return this.taskResourceService.update(id, updateTaskResourceDto);
  }

  @Delete(':id')
  @AuthenticatedUser
  @CheckPermission('TaskResource', 'delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.taskResourceService.remove(id);
  }

  @Post('reorder/:taskId')
  @AuthenticatedUser
  @CheckPermission('TaskResource', 'update')
  async reorder(
    @Param('taskId') taskId: string,
    @Body('resourceIds') resourceIds: string[],
  ): Promise<TaskResource[]> {
    return this.taskResourceService.reorder(taskId, resourceIds);
  }
} 