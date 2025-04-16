import { Controller, Get, Post, Body, Param, Delete, Put, Query, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { CreateMembershipDto, UpdateMembershipDto } from './membership.dto';
import { Membership } from './membership.schema';
import { AdminOnly, AuthenticatedUser, RequirePermission } from '../../common/decorators';
import { Permission } from '../../common/permissions.enum';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('memberships')
@Controller('memberships')
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  @Get()
  @AdminOnly
  @RequirePermission(Permission.READ_MEMBERSHIPS, 'list')
  async findAll(): Promise<Membership[]> {
    return this.membershipService.findAll();
  }

  @Get(':id')
  @AuthenticatedUser
  @RequirePermission(Permission.READ_MEMBERSHIPS, 'read')
  async findOne(@Param('id') id: string): Promise<Membership> {
    return this.membershipService.findOne(id);
  }

  @Post()
  @AuthenticatedUser
  @RequirePermission(Permission.CREATE_MEMBERSHIPS, 'create')
  async create(@Body() createMembershipDto: CreateMembershipDto): Promise<Membership> {
    return this.membershipService.create(createMembershipDto);
  }

  @Patch(':id')
  @AuthenticatedUser
  @RequirePermission(Permission.UPDATE_MEMBERSHIPS, 'update')
  async update(
    @Param('id') id: string,
    @Body() updateMembershipDto: UpdateMembershipDto,
  ): Promise<Membership> {
    return this.membershipService.update(id, updateMembershipDto);
  }

  @Delete(':id')
  @AdminOnly
  @RequirePermission(Permission.DELETE_MEMBERSHIPS, 'delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.membershipService.remove(id);
    return;
  }

  @Get('user/:userId')
  @AuthenticatedUser
  @RequirePermission(Permission.READ_MEMBERSHIPS, 'read')
  async findByUser(@Param('userId') userId: string): Promise<Membership[]> {
    return this.membershipService.findByUser(userId);
  }

  @Get('class/:classId')
  @AuthenticatedUser
  @RequirePermission(Permission.READ_MEMBERSHIPS, 'read')
  async findByClass(@Param('classId') classId: string): Promise<Membership[]> {
    return this.membershipService.findByClass(classId);
  }

  @Get('user/:userId/class/:classId')
  @AuthenticatedUser
  @RequirePermission(Permission.READ_MEMBERSHIPS, 'read')
  async findByUserAndClass(
    @Param('userId') userId: string,
    @Param('classId') classId: string,
  ): Promise<Membership | null> {
    return this.membershipService.findByUserAndClass(userId, classId);
  }

  @Delete('class/:classId')
  @AdminOnly
  @RequirePermission(Permission.DELETE_MEMBERSHIPS, 'delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteByClass(@Param('classId') classId: string): Promise<void> {
    await this.membershipService.deleteByClass(classId);
    return;
  }
} 