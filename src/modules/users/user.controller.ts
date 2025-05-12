import { Controller, Get, Post, Body, Param, Patch, Delete, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.interface';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { AdminOnly, AuthenticatedUser, RequirePermission, RequireOwnership, SetPermission } from '../../common/decorators';
import { Public, JwtAuthGuard, UserAccessGuard } from '../../common/guards';
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

  @Get(':email')
  @UseGuards(JwtAuthGuard, UserAccessGuard)
  @ApiOperation({ summary: 'Get a user by email', description: 'Accessible to the user themselves or administrators' })
  @ApiParam({ name: 'email', description: 'Email of the user to retrieve' })
  @ApiResponse({ 
    status: 200, 
    description: 'User retrieved successfully',
    type: UserResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - You are not the owner of this resource' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findByEmail(@Param('email') email: string): Promise<User> {
    return this.userService.findByEmail(email);
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

  @Patch(':email')
  @UseGuards(JwtAuthGuard, UserAccessGuard)
  @ApiOperation({ summary: 'Update a user', description: 'Accessible to the user themselves or administrators' })
  @ApiParam({ name: 'email', description: 'Email of the user to update' })
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
    @Param('email') email: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.userService.update(email, updateUserDto);
  }

  @Delete(':email')
  @AdminOnly
  @RequirePermission('User', 'delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user', description: 'Accessible only to administrators' })
  @ApiParam({ name: 'email', description: 'Email of the user to delete' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires administrator privileges' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async delete(@Param('email') email: string): Promise<void> {
    await this.userService.delete(email);
  }
} 