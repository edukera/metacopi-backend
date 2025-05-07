import { Controller, Get, Post, Body, Param, Patch, Delete, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { UserService, UserWithRole, LimitedUserWithRole } from './user.service';
import { User } from './user.interface';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { AdminOnly, AuthenticatedUser, RequirePermission, RequireOwnership, SetPermission } from '../../common/decorators';
import { Public, ClassAccessGuard, JwtAuthGuard } from '../../common/guards';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
@ApiBearerAuth('JWT-auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @AdminOnly
  @RequirePermission('User', 'list')
  @ApiOperation({ summary: 'Get all users', description: 'Accessible only to administrators' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of users retrieved successfully',
    type: [UserResponseDto] 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires administrator privileges' })
  async findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Get('class/:classId')
  @UseGuards(JwtAuthGuard, ClassAccessGuard)
  @ApiOperation({ summary: 'Get all users in a class with their role', description: 'Accessible to teachers of the class and administrators' })
  @ApiParam({ name: 'classId', description: 'ID of the class to get users for' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of users in class retrieved successfully with their membership role',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          avatarUrl: { type: 'string' },
          membershipRole: { type: 'string', enum: ['teacher', 'student'] }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Must be a teacher of this class or an administrator' })
  async findByClass(@Param('classId') classId: string): Promise<LimitedUserWithRole[]> {
    return this.userService.findByClassId(classId);
  }

  @Get(':id')
  @RequireOwnership('User', 'read', 'id')
  @ApiOperation({ summary: 'Get a user by ID', description: 'Accessible to the user themselves or administrators' })
  @ApiParam({ name: 'id', description: 'ID of the user to retrieve' })
  @ApiResponse({ 
    status: 200, 
    description: 'User retrieved successfully',
    type: UserResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - You are not the owner of this resource' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findById(@Param('id') id: string): Promise<User> {
    return this.userService.findById(id);
  }

  @Public()
  @Post()
  @ApiOperation({ summary: 'Create a new user', description: 'Publicly accessible for registration' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ 
    status: 201, 
    description: 'User created successfully',
    type: UserResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.userService.create(createUserDto);
  }

  @Patch(':id')
  @RequireOwnership('User', 'update', 'id')
  @ApiOperation({ summary: 'Update a user', description: 'Accessible to the user themselves or administrators' })
  @ApiParam({ name: 'id', description: 'ID of the user to update' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ 
    status: 200, 
    description: 'User updated successfully',
    type: UserResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - You are not the owner of this resource' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @AdminOnly
  @RequirePermission('User', 'delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user', description: 'Accessible only to administrators' })
  @ApiParam({ name: 'id', description: 'ID of the user to delete' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires administrator privileges' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.userService.delete(id);
  }
} 