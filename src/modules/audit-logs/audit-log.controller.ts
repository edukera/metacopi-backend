import { Controller, Get, Post, Body, Param, Delete, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { CreateAuditLogDto, FindAuditLogsDto } from './audit-log.dto';
import { AuditLog, TargetType } from './audit-log.schema';
import { AdminOnly, RequirePermission } from '../../common/decorators';
import { Permission } from '../../common/permissions.enum';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('audit-logs')
@Controller('logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Post()
  @RequirePermission(Permission.CREATE_AUDIT_LOGS, 'create')
  async create(@Body() createAuditLogDto: CreateAuditLogDto): Promise<AuditLog> {
    return this.auditLogService.create(createAuditLogDto);
  }

  @Get()
  @AdminOnly
  @RequirePermission(Permission.READ_AUDIT_LOGS, 'list')
  async findAll(@Query() query: FindAuditLogsDto): Promise<AuditLog[]> {
    return this.auditLogService.findAll(query);
  }

  @Get(':id')
  @AdminOnly
  @RequirePermission(Permission.READ_AUDIT_LOGS, 'read')
  async findOne(@Param('id') id: string): Promise<AuditLog> {
    return this.auditLogService.findById(id);
  }

  @Get('user/:userId')
  @AdminOnly
  @RequirePermission(Permission.READ_AUDIT_LOGS, 'read')
  async findByUser(@Param('userId') userId: string): Promise<AuditLog[]> {
    return this.auditLogService.findByUser(userId);
  }

  @Get('target/:targetType/:targetId')
  @AdminOnly
  @RequirePermission(Permission.READ_AUDIT_LOGS, 'read')
  async findByTarget(
    @Param('targetType') targetType: TargetType,
    @Param('targetId') targetId: string,
  ): Promise<AuditLog[]> {
    return this.auditLogService.findByTarget(targetType, targetId);
  }

  @Get('action/:action')
  @AdminOnly
  @RequirePermission(Permission.READ_AUDIT_LOGS, 'read')
  async findByAction(@Param('action') action: string): Promise<AuditLog[]> {
    return this.auditLogService.findByAction(action);
  }

  @Delete(':id')
  @AdminOnly
  @RequirePermission(Permission.DELETE_AUDIT_LOGS, 'delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.auditLogService.remove(id);
  }
} 