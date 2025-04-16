import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { CorrectionService } from './correction.service';
import { CreateCorrectionDto, UpdateCorrectionDto } from './correction.dto';
import { Correction } from './correction.schema';
import { AdminOnly, AuthenticatedUser, RequirePermission } from '../../common/decorators';
import { Permission } from '../../common/permissions.enum';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('corrections')
@Controller('corrections')
export class CorrectionController {
  constructor(private readonly correctionService: CorrectionService) {}

  @Post()
  @AuthenticatedUser
  @RequirePermission(Permission.CREATE_CORRECTIONS, 'create')
  async create(@Body() createCorrectionDto: CreateCorrectionDto): Promise<Correction> {
    return this.correctionService.create(createCorrectionDto);
  }

  @Get()
  @AdminOnly
  @RequirePermission(Permission.READ_CORRECTIONS, 'list')
  async findAll(): Promise<Correction[]> {
    return this.correctionService.findAll();
  }

  @Get(':id')
  @AuthenticatedUser
  @RequirePermission(Permission.READ_CORRECTIONS, 'read')
  async findOne(@Param('id') id: string): Promise<Correction> {
    return this.correctionService.findOne(id);
  }

  @Get('submission/:submissionId')
  @AuthenticatedUser
  @RequirePermission(Permission.READ_CORRECTIONS, 'read')
  async findBySubmission(@Param('submissionId') submissionId: string): Promise<Correction> {
    return this.correctionService.findBySubmission(submissionId);
  }

  @Get('teacher/:teacherId')
  @AuthenticatedUser
  @RequirePermission(Permission.READ_CORRECTIONS, 'read')
  async findByTeacher(@Param('teacherId') teacherId: string): Promise<Correction[]> {
    return this.correctionService.findByTeacher(teacherId);
  }

  @Patch(':id')
  @AuthenticatedUser
  @RequirePermission(Permission.UPDATE_CORRECTIONS, 'update')
  async update(
    @Param('id') id: string,
    @Body() updateCorrectionDto: UpdateCorrectionDto,
  ): Promise<Correction> {
    return this.correctionService.update(id, updateCorrectionDto);
  }

  @Delete(':id')
  @AdminOnly
  @RequirePermission(Permission.DELETE_CORRECTIONS, 'delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.correctionService.remove(id);
  }
} 