import { Injectable, NotFoundException, BadRequestException, UnauthorizedException, Inject, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Class } from './class.schema';
import { CreateClassDto, UpdateClassDto, ClassResponseDto } from './class.dto';
import { MembershipService } from '../memberships/membership.service';
import { MembershipRole } from '../memberships/membership.schema';
import { REQUEST } from '@nestjs/core';

@Injectable()
export class ClassService {
  private readonly logger = new Logger(ClassService.name);

  constructor(
    @InjectModel(Class.name) private classModel: Model<Class>,
    private membershipService: MembershipService,
    @Inject(REQUEST) private request,
  ) {}

  // Convertir un objet Class en ClassResponseDto
  private toResponseDto(classEntity: Class): ClassResponseDto {
    const classDto = new ClassResponseDto();
    classDto.id = classEntity._id.toString();
    classDto.name = classEntity.name;
    classDto.description = classEntity.description;
    classDto.createdBy = classEntity.createdBy?.toString();
    classDto.archived = classEntity.archived;
    classDto.code = classEntity.code;
    classDto.settings = classEntity.settings;
    classDto.startDate = classEntity.startDate;
    classDto.endDate = classEntity.endDate;
    classDto.createdAt = classEntity.createdAt;
    classDto.updatedAt = classEntity.updatedAt;
    return classDto;
  }

  // Convertir une liste d'objets Class en liste de ClassResponseDto
  private toResponseDtoList(classes: Class[]): ClassResponseDto[] {
    return classes.map(classEntity => this.toResponseDto(classEntity));
  }

  async create(createClassDto: CreateClassDto): Promise<ClassResponseDto> {
    // Get the user ID from the request context
    const userId = this.request.user.sub;

    const newClass = new this.classModel({
      ...createClassDto,
      createdBy: userId,
    });
    
    const savedClass = await newClass.save();
    
    // Automatically create a membership for the creator as a teacher
    await this.membershipService.create({
      userId,
      classId: savedClass._id.toString(),
      role: MembershipRole.TEACHER,
    });
    
    return this.toResponseDto(savedClass);
  }

  async findAll(archived: boolean = false): Promise<ClassResponseDto[]> {
    // If the user is an admin, they can see all classes
    const userId = this.request.user.id;
    const role = this.request.user.role;

    let classes: Class[];

    if (role === 'admin') {
      classes = await this.classModel.find({ archived }).exec();
    } else {
      // For normal users, get the classes they are associated with
      const memberships = await this.membershipService.findByUser(userId);
      const classIds = memberships.map(m => m.classId);
            
      // Convert class IDs from strings to ObjectIds if they aren't already
      const classObjectIds = classIds.map(id => 
        typeof id === 'string' ? new Types.ObjectId(id) : id
      );
      
      classes = await this.classModel.find({ 
        _id: { $in: classObjectIds }, 
        archived 
      }).exec();
    }

    return this.toResponseDtoList(classes);
  }

  async findOne(id: string): Promise<ClassResponseDto> {
    const classEntity = await this.classModel.findById(id).exec();
    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${id} not found`);
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
    const updatedClass = await this.classModel
      .findByIdAndUpdate(id, updateClassDto, { new: true })
      .exec();
      
    if (!updatedClass) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }
    
    return this.toResponseDto(updatedClass);
  }

  async remove(id: string): Promise<void> {
    const result = await this.classModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }
    
    // Delete all memberships associated with this class
    await this.membershipService.deleteByClass(id);
  }

  async archive(id: string): Promise<ClassResponseDto> {
    const classEntity = await this.classModel.findById(id).exec();
    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }
    
    classEntity.archived = true;
    const savedClass = await classEntity.save();
    return this.toResponseDto(savedClass);
  }

  async regenerateCode(id: string): Promise<{ code: string }> {
    const classEntity = await this.classModel.findById(id).exec();
    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }
    
    // Generate a new invitation code
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    classEntity.code = newCode;
    await classEntity.save();
    
    return { code: newCode };
  }

  async joinClass(id: string, code: string): Promise<void> {
    const userId = this.request.user.sub;
    
    const classEntity = await this.classModel.findById(id).exec();
    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }
    
    if (classEntity.code !== code) {
      throw new BadRequestException('Invalid invitation code');
    }
    
    if (classEntity.archived) {
      throw new BadRequestException('This class is archived and no longer accepts new members');
    }
    
    // Check if the user is already a member of this class
    const existingMembership = await this.membershipService.findByUserAndClass(userId, id);
    
    if (existingMembership) {
      throw new BadRequestException('You are already a member of this class');
    }
    
    // Create membership with the student role by default
    await this.membershipService.create({
      userId,
      classId: id,
      role: MembershipRole.STUDENT,
    });
  }
} 