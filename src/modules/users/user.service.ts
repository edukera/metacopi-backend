import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { MongoUserRepository } from './user.repository';
import { User, CreateUserDto, UpdateUserDto } from './user.interface';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  
  constructor(private readonly userRepository: MongoUserRepository) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException(`A user with email ${createUserDto.email} already exists`);
    }

    return this.userRepository.create(createUserDto);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.update(id, updateUserDto);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.userRepository.delete(id);
    if (!result) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return true;
  }

  async comparePasswords(plainTextPassword: string, hashedPassword: string): Promise<boolean> {
    this.logger.debug(`Comparing password: plainTextPassword length=${plainTextPassword.length}, hashedPassword=${hashedPassword}`);
    try {
      const result = await bcrypt.compare(plainTextPassword, hashedPassword);
      this.logger.debug(`Password comparison result: ${result}`);
      return result;
    } catch (error) {
      this.logger.error(`Error comparing passwords: ${error.message}`);
      return false;
    }
  }
} 