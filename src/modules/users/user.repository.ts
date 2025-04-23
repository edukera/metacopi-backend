import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User as UserSchema, UserDocument, UserRole } from './user.schema';
import { User, UserRepository, CreateUserDto, UpdateUserDto } from './user.interface';

@Injectable()
export class MongoUserRepository implements UserRepository {
  private readonly logger = new Logger(MongoUserRepository.name);
  
  constructor(
    @InjectModel(UserSchema.name) private userModel: Model<UserDocument>,
  ) {}

  async findById(id: string): Promise<User | null> {
    this.logger.debug(`Finding user by ID: ${id}`);
    const user = await this.userModel.findById(id).exec();
    this.logger.debug(`User with ID ${id} found: ${!!user}`);
    return user ? this.mapToUser(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    this.logger.debug(`Finding user by email: ${email}`);
    const user = await this.userModel.findOne({ email }).exec();
    this.logger.debug(`User with email ${email} found: ${!!user}`);
    if (user) {
      this.logger.debug(`User password hash: ${user.password}`);
    }
    return user ? this.mapToUser(user) : null;
  }

  async findAll(): Promise<User[]> {
    const users = await this.userModel.find().exec();
    return users.map(user => this.mapToUser(user));
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const createdUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });
    const savedUser = await createdUser.save();
    return this.mapToUser(savedUser);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    const updatedData: any = { ...updateUserDto };
    
    if (updateUserDto.password) {
      updatedData.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updatedData, { new: true })
      .exec();
      
    return updatedUser ? this.mapToUser(updatedUser) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.userModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  private mapToUser(userDocument: UserDocument): User {
    const userObject = userDocument.toObject();
    return {
      id: userObject._id.toString(),
      email: userObject.email,
      password: userObject.password,
      firstName: userObject.firstName,
      lastName: userObject.lastName,
      avatarUrl: userObject.avatarUrl,
      emailVerified: userObject.emailVerified,
      role: userObject.role as UserRole,
      createdAt: userObject.createdAt,
      updatedAt: userObject.updatedAt,
    };
  }
} 