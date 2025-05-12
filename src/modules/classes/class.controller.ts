import { Controller, Get, Post, Body, Param, Patch, Delete, HttpCode, HttpStatus, Query, Inject, UseGuards } from '@nestjs/common';
import { ClassService } from './class.service';
import { CreateClassDto, UpdateClassDto, JoinClassDto, ClassResponseDto, ClassUserResponseDto } from './class.dto';
import { Class } from './class.schema';
import { AdminOnly, AuthenticatedUser } from '../../common/decorators';
import { CheckPermission } from '../../common/guards/permission.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { REQUEST } from '@nestjs/core';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { MembershipService } from '../memberships/membership.service';
import { Membership } from '../memberships/membership.schema';
import { ClassAccessGuard } from '../../common/guards/class-access.guard';
import { JwtAuthGuard } from '../../common/guards';

@ApiTags('classes')
@Controller('classes')
@ApiBearerAuth('JWT-auth')
export class ClassController {
  constructor(
    private readonly classService: ClassService,
    @Inject(REQUEST) private readonly request,
    @InjectModel(Class.name) private readonly classModel: Model<Class>,
    @InjectModel(Membership.name) private readonly membershipModel: Model<Membership>,
    private readonly membershipService: MembershipService,
  ) {}

  @Get()
  @AuthenticatedUser
  @CheckPermission('Class', 'list')
  @ApiOperation({ summary: 'Get all classes', description: 'Retrieves the list of classes accessible to the authenticated user' })
  @ApiQuery({ name: 'archived', required: false, type: Boolean, description: 'Filter to include/exclude archived classes' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of classes successfully retrieved',
    type: [ClassResponseDto]
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Missing or invalid token' })
  async findAll(@Query('archived') archived?: boolean): Promise<ClassResponseDto[]> {
    return this.classService.findAll(archived);
  }

  @Get(':classId')
  @AuthenticatedUser
  @CheckPermission('Class', 'read')
  @ApiOperation({ summary: 'Get a class by ID', description: 'Retrieves the details of a specific class by its logical business ID or MongoDB _id' })
  @ApiParam({ name: 'classId', description: 'Logical business ID or MongoDB _id of the class to retrieve' })
  @ApiResponse({ 
    status: 200, 
    description: 'Class successfully retrieved',
    type: ClassResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - You do not have access to this class' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  async findById(@Param('classId') id: string): Promise<ClassResponseDto> {
    return this.classService.findOne(id);
  }

  @Get(':classId/users')
  @UseGuards(JwtAuthGuard, ClassAccessGuard)
  @ApiOperation({ summary: 'Get all users in a class with their role', description: 'Accessible to teachers of the class and administrators' })
  @ApiParam({ name: 'classId', description: 'Logical business ID or MongoDB _id of the class to get users for' })
  @ApiQuery({ name: 'email', required: false, type: String, description: 'Filter users by email (optional)' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of users in class retrieved successfully with their membership role',
    type: [ClassUserResponseDto]
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Must be a teacher of this class or an administrator' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  async getClassUsers(
    @Param('classId') id: string,
    @Query('email') email?: string
  ): Promise<ClassUserResponseDto[]> {
    return this.classService.getUsersByClassId(id, email);
  }

  @Post()
  @AuthenticatedUser
  @CheckPermission('Class', 'create')
  @ApiOperation({ summary: 'Create a new class', description: 'Creates a new class with the authenticated user as creator. The logical business ID (id) must be provided and unique.' })
  @ApiBody({ type: CreateClassDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Class successfully created',
    type: ClassResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Missing or invalid token' })
  async create(@Body() createClassDto: CreateClassDto): Promise<ClassResponseDto> {
    return this.classService.create(createClassDto);
  }

  @Patch(':classId')
  @AuthenticatedUser
  @CheckPermission('Class', 'update')
  @ApiOperation({ summary: 'Update a class', description: 'Updates the information of an existing class by its logical business ID or MongoDB _id' })
  @ApiParam({ name: 'classId', description: 'Logical business ID or MongoDB _id of the class to update' })
  @ApiBody({ type: UpdateClassDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Class successfully updated',
    type: ClassResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - You are not the owner of this class' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  async update(
    @Param('classId') id: string,
    @Body() updateClassDto: UpdateClassDto,
  ): Promise<ClassResponseDto> {
    return this.classService.update(id, updateClassDto);
  }

  @Delete(':classId')
  @AdminOnly
  @CheckPermission('Class', 'delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a class', description: 'Permanently deletes a class (admin only) by its logical business ID or MongoDB _id' })
  @ApiParam({ name: 'classId', description: 'Logical business ID or MongoDB _id of the class to delete' })
  @ApiResponse({ status: 204, description: 'Class successfully deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires administrator privileges' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  async delete(@Param('classId') id: string): Promise<void> {
    await this.classService.remove(id);
    return;
  }

  @Patch(':classId/archive')
  @AuthenticatedUser
  @CheckPermission('Class', 'archive')
  @ApiOperation({ summary: 'Archive a class', description: 'Marks a class as archived or active by its logical business ID or MongoDB _id' })
  @ApiParam({ name: 'classId', description: 'Logical business ID or MongoDB _id of the class to archive' })
  @ApiResponse({ 
    status: 200, 
    description: 'Class successfully archived',
    type: ClassResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - You are not the owner of this class' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  async archive(@Param('classId') id: string): Promise<ClassResponseDto> {
    return this.classService.archive(id);
  }

  @Post(':classId/regenerate-code')
  @AuthenticatedUser
  @CheckPermission('Class', 'regenerateCode')
  @ApiOperation({ summary: 'Regenerate class code', description: 'Generates a new invitation code for a class by its logical business ID or MongoDB _id' })
  @ApiParam({ name: 'classId', description: 'Logical business ID or MongoDB _id of the class for which to regenerate the code' })
  @ApiResponse({ 
    status: 200, 
    description: 'Code successfully regenerated',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'string', example: 'XYZ123' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - You are not the owner of this class' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  async regenerateCode(@Param('classId') id: string): Promise<{ code: string }> {
    return this.classService.regenerateCode(id);
  }

  @Get('code/:code')
  @AuthenticatedUser
  @CheckPermission('Class', 'read')
  @ApiOperation({ summary: 'Get a class by code', description: 'Retrieves the details of a class using its invitation code' })
  @ApiParam({ name: 'code', description: 'Code of the class to retrieve' })
  @ApiResponse({ 
    status: 200, 
    description: 'Class successfully retrieved',
    type: ClassResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Missing or invalid token' })
  @ApiResponse({ status: 404, description: 'Class not found or invalid code' })
  async findByCode(@Param('code') code: string): Promise<ClassResponseDto> {
    return this.classService.findByCode(code);
  }

  @Post(':classId/join')
  @AuthenticatedUser
  @CheckPermission('Class', 'join')
  @ApiOperation({ summary: 'Join a class', description: 'Allows the authenticated user to join a class with the provided code, using the logical business ID or MongoDB _id' })
  @ApiParam({ name: 'classId', description: 'Logical business ID or MongoDB _id of the class to join' })
  @ApiBody({ type: JoinClassDto })
  @ApiResponse({ status: 201, description: 'Class successfully joined' })
  @ApiResponse({ status: 400, description: 'Invalid or expired code' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Missing or invalid token' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  @ApiResponse({ status: 409, description: 'You are already a member of this class' })
  async joinClass(
    @Param('classId') id: string,
    @Body('code') code: string,
  ): Promise<void> {
    return this.classService.joinClass(id, code);
  }
} 