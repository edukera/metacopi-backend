import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { CorrectionService } from './correction.service';
import { CreateCorrectionDto, UpdateCorrectionDto } from './correction.dto';
import { Correction } from './correction.schema';
import { AdminOnly, AuthenticatedUser, SetPermission } from '../../common/decorators';
import { Permission } from '../../common/permissions.enum';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, CorrectionAccessGuard } from '../../common/guards';

@ApiTags('corrections')
@Controller('corrections')
export class CorrectionController {
  constructor(private readonly correctionService: CorrectionService) {}

  @Post()
  @AuthenticatedUser
  @UseGuards(JwtAuthGuard, CorrectionAccessGuard)
  @SetPermission(Permission.CREATE_CORRECTIONS, 'create')
  async create(@Body() createCorrectionDto: CreateCorrectionDto): Promise<Correction> {
    return this.correctionService.create(createCorrectionDto);
  }

  @Get()
  @AdminOnly
  @UseGuards(JwtAuthGuard, CorrectionAccessGuard)
  @SetPermission(Permission.READ_CORRECTIONS, 'list')
  async findAll(): Promise<Correction[]> {
    return this.correctionService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, CorrectionAccessGuard)
  @SetPermission(Permission.READ_CORRECTIONS, 'read')
  async findOne(@Param('id') id: string): Promise<Correction> {
    return this.correctionService.findOne(id);
  }

  @Get('submission/:submissionId')
  @UseGuards(JwtAuthGuard, CorrectionAccessGuard)
  @SetPermission(Permission.READ_CORRECTIONS, 'read')
  async findBySubmission(@Param('submissionId') submissionId: string): Promise<Correction> {
    return this.correctionService.findBySubmission(submissionId);
  }

  @Get('teacher/:teacherId')
  @UseGuards(JwtAuthGuard, CorrectionAccessGuard)
  @SetPermission(Permission.READ_CORRECTIONS, 'read')
  async findByTeacher(@Param('teacherId') teacherId: string): Promise<Correction[]> {
    return this.correctionService.findByTeacher(teacherId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, CorrectionAccessGuard)
  @SetPermission(Permission.UPDATE_CORRECTIONS, 'update')
  async update(
    @Param('id') id: string,
    @Body() updateCorrectionDto: UpdateCorrectionDto,
  ): Promise<Correction> {
    return this.correctionService.update(id, updateCorrectionDto);
  }

  @Delete(':id')
  @AdminOnly
  @UseGuards(JwtAuthGuard, CorrectionAccessGuard)
  @SetPermission(Permission.DELETE_CORRECTIONS, 'delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.correctionService.remove(id);
  }
} 