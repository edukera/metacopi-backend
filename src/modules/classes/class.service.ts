import { Injectable, NotFoundException, BadRequestException, UnauthorizedException, Inject, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Class } from './class.schema';
import { CreateClassDto, UpdateClassDto, ClassResponseDto, ClassUserResponseDto } from './class.dto';
import { MembershipService } from '../memberships/membership.service';
import { MembershipRole } from '../memberships/membership.schema';
import { REQUEST } from '@nestjs/core';
import { UserService } from '../users/user.service';

@Injectable()
export class ClassService {
  private readonly logger = new Logger(ClassService.name);

  constructor(
    @InjectModel(Class.name) private classModel: Model<Class>,
    private membershipService: MembershipService,
    private userService: UserService,
    @Inject(REQUEST) private request,
  ) {}

  // Convert a Class object to ClassResponseDto
  private toResponseDto(classEntity: Class): ClassResponseDto {
    const classDto = new ClassResponseDto();
    classDto.id = classEntity.id;
    classDto.name = classEntity.name;
    classDto.description = classEntity.description;
    classDto.createdByEmail = classEntity.createdByEmail;
    classDto.archived = classEntity.archived;
    classDto.code = classEntity.code;
    classDto.settings = classEntity.settings;
    classDto.startDate = classEntity.startDate;
    classDto.endDate = classEntity.endDate;
    classDto.createdAt = classEntity.createdAt;
    classDto.updatedAt = classEntity.updatedAt;
    return classDto;
  }

  // Convert a list of Class objects to a list of ClassResponseDto
  private toResponseDtoList(classes: Class[]): ClassResponseDto[] {
    return classes.map(classEntity => this.toResponseDto(classEntity));
  }

  async create(createClassDto: CreateClassDto): Promise<ClassResponseDto> {
    // Get the user email from the request context
    const email = this.request.user.email;

    const newClass = new this.classModel({
      ...createClassDto,
      createdByEmail: email,
    });
    
    const savedClass = await newClass.save();
    
    // Automatically create a membership for the creator as a teacher
    await this.membershipService.create({
      email,
      classId: savedClass._id.toString(),
      role: MembershipRole.TEACHER,
    });
    
    return this.toResponseDto(savedClass);
  }

  async findAll(archived: boolean = false): Promise<ClassResponseDto[]> {
    // If the user is an admin, they can see all classes
    const email = this.request.user.email;
    const role = this.request.user.role;

    let classes: Class[];

    if (role === 'admin') {
      classes = await this.classModel.find({ archived }).exec();
    } else {
      // For normal users, get the classes they are associated with
      const memberships = await this.membershipService.findByUserEmail(email);
      const classIds = memberships.map(m => m.classId);
      // Use the logical ID field (string) for the join
      classes = await this.classModel.find({ id: { $in: classIds }, archived }).exec();
    }

    return this.toResponseDtoList(classes);
  }

  async findOne(id: string): Promise<ClassResponseDto> {
    // First search by logical ID, then by MongoDB _id if not found
    let classEntity = await this.classModel.findOne({ id }).exec();
    if (!classEntity && Types.ObjectId.isValid(id)) {
      classEntity = await this.classModel.findById(id).exec();
    }
    if (!classEntity) {
      throw new NotFoundException(`Class with logical ID or MongoDB ID '${id}' not found`);
    }
    return this.toResponseDto(classEntity);
  }

  async findByCode(code: string): Promise<ClassResponseDto> {
    const classEntity = await this.classModel.findOne({ code }).exec();
    if (!classEntity) {
      throw new NotFoundException(`Class with code ${code} not found`);
    }
    return this.toResponseDto(classEntity);
  }

  async update(id: string, updateClassDto: UpdateClassDto): Promise<ClassResponseDto> {
    // First search by logical ID, then by MongoDB _id if not found
    let classEntity = await this.classModel.findOne({ id }).exec();
    if (!classEntity && Types.ObjectId.isValid(id)) {
      classEntity = await this.classModel.findById(id).exec();
    }
    if (!classEntity) {
      throw new NotFoundException(`Class with logical ID or MongoDB ID '${id}' not found`);
    }
    const updatedClass = await this.classModel.findByIdAndUpdate(classEntity._id, updateClassDto, { new: true }).exec();
    return this.toResponseDto(updatedClass);
  }

  async remove(id: string): Promise<void> {
    // First search by logical ID, then by MongoDB _id if not found
    let classEntity = await this.classModel.findOne({ id }).exec();
    if (!classEntity && Types.ObjectId.isValid(id)) {
      classEntity = await this.classModel.findById(id).exec();
    }
    if (!classEntity) {
      throw new NotFoundException(`Class with logical ID or MongoDB ID '${id}' not found`);
    }
    const result = await this.classModel.findByIdAndDelete(classEntity._id).exec();
    if (!result) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }
    // Delete all memberships associated with this class - use logical ID
    await this.membershipService.deleteByClass(classEntity.id);
  }

  async archive(id: string): Promise<ClassResponseDto> {
    // First search by logical ID, then by MongoDB _id if not found
    let classEntity = await this.classModel.findOne({ id }).exec();
    if (!classEntity && Types.ObjectId.isValid(id)) {
      classEntity = await this.classModel.findById(id).exec();
    }
    if (!classEntity) {
      throw new NotFoundException(`Class with logical ID or MongoDB ID '${id}' not found`);
    }
    classEntity.archived = true;
    const savedClass = await classEntity.save();
    return this.toResponseDto(savedClass);
  }

  async regenerateCode(id: string): Promise<{ code: string }> {
    // First search by logical ID, then by MongoDB _id if not found
    let classEntity = await this.classModel.findOne({ id }).exec();
    if (!classEntity && Types.ObjectId.isValid(id)) {
      classEntity = await this.classModel.findById(id).exec();
    }
    if (!classEntity) {
      throw new NotFoundException(`Class with logical ID or MongoDB ID '${id}' not found`);
    }
    // Generate a new invitation code
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    classEntity.code = newCode;
    await classEntity.save();
    return { code: newCode };
  }

  async joinClass(id: string, code: string): Promise<void> {
    const email = this.request.user.email;
    // First search by logical ID, then by MongoDB _id if not found
    let classEntity = await this.classModel.findOne({ id }).exec();
    if (!classEntity && Types.ObjectId.isValid(id)) {
      classEntity = await this.classModel.findById(id).exec();
    }
    if (!classEntity) {
      throw new NotFoundException(`Class with logical ID or MongoDB ID '${id}' not found`);
    }
    if (classEntity.code !== code) {
      throw new BadRequestException('Invalid invitation code');
    }
    if (classEntity.archived) {
      throw new BadRequestException('This class is archived and no longer accepts new members');
    }
    // Check if the user is already a member of this class - use logical ID
    const existingMembership = await this.membershipService.findByUserAndClass(email, classEntity.id);
    if (existingMembership) {
      throw new BadRequestException('You are already a member of this class');
    }
    // Create membership with the student role by default - use logical ID
    await this.membershipService.create({
      email,
      classId: classEntity.id,
      role: MembershipRole.STUDENT,
    });
  }

  async getUsersByClassId(id: string, email?: string): Promise<ClassUserResponseDto[]> {
    this.logger.log(`Getting users for class ID: ${id}${email ? `, filtered by email: ${email}` : ''}`);
    
    // Check if class exists
    let classEntity = await this.classModel.findOne({ id }).exec();
    if (!classEntity && Types.ObjectId.isValid(id)) {
      classEntity = await this.classModel.findById(id).exec();
    }
    if (!classEntity) {
      throw new NotFoundException(`Class with logical ID or MongoDB ID '${id}' not found`);
    }

    // Get all memberships for this class - use the logical ID instead of MongoDB ID
    let memberships = await this.membershipService.findByClass(classEntity.id);
    
    // Filter memberships by email if provided
    if (email) {
      memberships = memberships.filter(membership => 
        membership.email.toLowerCase().includes(email.toLowerCase())
      );
    }
    
    // Map memberships to ClassUserResponseDto
    const userResponses: ClassUserResponseDto[] = [];
    
    for (const membership of memberships) {
      try {
        // Get complete user information using UserService
        const user = await this.userService.findByEmail(membership.email);
        
        const userResponse = new ClassUserResponseDto();
        
        // User info
        userResponse.email = user.email;
        userResponse.firstName = user.firstName;
        userResponse.lastName = user.lastName;
        userResponse.avatarUrl = user.avatarUrl;
        
        // Membership info
        userResponse.role = membership.role;
        userResponse.joinedAt = membership.joinedAt;
        
        userResponses.push(userResponse);
      } catch (error) {
        this.logger.error(`Error getting user data for ${membership.email}: ${error.message}`, error.stack);
        // Continue with the next user
      }
    }
    
    return userResponses;
  }
} 