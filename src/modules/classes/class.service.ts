import { Injectable, NotFoundException, BadRequestException, UnauthorizedException, Inject, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Class } from './class.schema';
import { CreateClassDto, UpdateClassDto } from './class.dto';
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

  async create(createClassDto: CreateClassDto): Promise<Class> {
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
    
    return savedClass;
  }

  async findAll(archived: boolean = false): Promise<Class[]> {
    // If the user is an admin, they can see all classes
    const userId = this.request.user.id;
    const role = this.request.user.role;

    if (role === 'admin') {
      return this.classModel.find({ archived }).exec();
    } else {
      // For normal users, get the classes they are associated with
      const memberships = await this.membershipService.findByUser(userId);
      const classIds = memberships.map(m => m.classId);
            
      // Convert class IDs from strings to ObjectIds if they aren't already
      const classObjectIds = classIds.map(id => 
        typeof id === 'string' ? new Types.ObjectId(id) : id
      );
      
      return this.classModel.find({ 
        _id: { $in: classObjectIds }, 
        archived 
      }).exec();
    }
  }

  async findOne(id: string): Promise<Class> {
    const classEntity = await this.classModel.findById(id).exec();
    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }
    return classEntity;
  }

  async findByCode(code: string): Promise<Class> {
    const classEntity = await this.classModel.findOne({ code }).exec();
    if (!classEntity) {
      throw new NotFoundException(`Class with code ${code} not found`);
    }
    return classEntity;
  }

  async update(id: string, updateClassDto: UpdateClassDto): Promise<Class> {
    const updatedClass = await this.classModel
      .findByIdAndUpdate(id, updateClassDto, { new: true })
      .exec();
      
    if (!updatedClass) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }
    
    return updatedClass;
  }

  async remove(id: string): Promise<void> {
    const result = await this.classModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }
    
    // Delete all memberships associated with this class
    await this.membershipService.deleteByClass(id);
  }

  async archive(id: string): Promise<Class> {
    const classEntity = await this.classModel.findById(id).exec();
    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }
    
    classEntity.archived = true;
    return classEntity.save();
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