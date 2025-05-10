import { Controller, Get, Post, Body, Param, Delete, Put, Query, HttpCode, HttpStatus, Patch, UseGuards } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { CreateMembershipDto, UpdateMembershipDto } from './membership.dto';
import { Membership } from './membership.schema';
import { AdminOnly, AuthenticatedUser, RequirePermission, SetPermission } from '../../common/decorators';
import { Permission } from '../../common/permissions.enum';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard, MembershipAccessGuard } from '../../common/guards';

@ApiTags('memberships')
@Controller('memberships')
@ApiBearerAuth()
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  @Get()
  @AdminOnly
  @RequirePermission(Permission.READ_MEMBERSHIPS, 'list')
  async findAll(): Promise<Membership[]> {
    return this.membershipService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, MembershipAccessGuard)
  @SetPermission(Permission.READ_MEMBERSHIPS, 'read')
  @ApiOperation({ summary: 'Get a membership by ID' })
  @ApiParam({ name: 'id', description: 'Membership ID' })
  @ApiResponse({ status: 200, description: 'Membership found', type: Membership })
  @ApiResponse({ status: 403, description: 'Forbidden - You do not have permission to access this membership' })
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
  @UseGuards(JwtAuthGuard, MembershipAccessGuard)
  @SetPermission(Permission.UPDATE_MEMBERSHIPS, 'update')
  @ApiOperation({ summary: 'Update a membership' })
  @ApiParam({ name: 'id', description: 'Membership ID' })
  @ApiResponse({ status: 200, description: 'Membership updated', type: Membership })
  @ApiResponse({ status: 403, description: 'Forbidden - You do not have permission to update this membership' })
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

  @Get('user/:email')
  @UseGuards(JwtAuthGuard, MembershipAccessGuard)
  @SetPermission(Permission.READ_MEMBERSHIPS, 'read')
  @ApiOperation({ summary: 'Get all memberships for a user' })
  @ApiParam({ name: 'email', description: 'User email' })
  @ApiResponse({ status: 200, description: 'List of memberships', type: [Membership] })
  @ApiResponse({ status: 403, description: 'Forbidden - You do not have permission to access these memberships' })
  async findByUserEmail(@Param('email') email: string): Promise<Membership[]> {
    return this.membershipService.findByUserEmail(email);
  }

  @Get('class/:classId')
  @UseGuards(JwtAuthGuard, MembershipAccessGuard)
  @SetPermission(Permission.READ_MEMBERSHIPS, 'read')
  @ApiOperation({ summary: 'Get all memberships for a class' })
  @ApiParam({ name: 'classId', description: 'Class ID' })
  @ApiResponse({ status: 200, description: 'List of memberships', type: [Membership] })
  @ApiResponse({ status: 403, description: 'Forbidden - You do not have permission to access these memberships' })
  async findByClass(@Param('classId') classId: string): Promise<Membership[]> {
    return this.membershipService.findByClass(classId);
  }

  @Get('user/:email/class/:classId')
  @UseGuards(JwtAuthGuard, MembershipAccessGuard)
  @SetPermission(Permission.READ_MEMBERSHIPS, 'read')
  @ApiOperation({ summary: 'Get membership for specific user and class' })
  @ApiParam({ name: 'email', description: 'User email' })
  @ApiParam({ name: 'classId', description: 'Class ID' })
  @ApiResponse({ status: 200, description: 'Membership found', type: Membership })
  @ApiResponse({ status: 403, description: 'Forbidden - You do not have permission to access this membership' })
  async findByUserAndClass(
    @Param('email') email: string,
    @Param('classId') classId: string,
  ): Promise<Membership | null> {
    return this.membershipService.findByUserAndClass(email, classId);
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