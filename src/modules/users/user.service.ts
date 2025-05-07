import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { MongoUserRepository } from './user.repository';
import { User, CreateUserDto, UpdateUserDto } from './user.interface';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Membership, MembershipRole } from '../memberships/membership.schema';

// Interface pour représenter un utilisateur avec son rôle dans une classe
export interface UserWithRole extends User {
  membershipRole?: MembershipRole;
}

// Interface pour représenter un utilisateur avec des informations limitées et son rôle
export interface LimitedUserWithRole {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  membershipRole?: MembershipRole;
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  
  constructor(
    private readonly userRepository: MongoUserRepository,
    @InjectModel(Membership.name) private readonly membershipModel: Model<Membership>,
  ) {}

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

  /**
   * Récupère tous les utilisateurs d'une classe spécifique avec leur rôle
   * @param classId ID de la classe
   * @returns Liste des utilisateurs appartenant à cette classe avec leur rôle
   */
  async findByClassId(classId: string): Promise<LimitedUserWithRole[]> {
    this.logger.debug(`Finding users for class: ${classId}`);
    
    try {
      // Récupérer toutes les adhésions pour cette classe
      const classObjectId = new Types.ObjectId(classId);
      const memberships = await this.membershipModel.find({
        classId: classObjectId,
        isActive: true
      }).exec();
      
      if (!memberships || memberships.length === 0) {
        this.logger.debug(`No memberships found for class ${classId}`);
        return [];
      }
      
      this.logger.debug(`Found ${memberships.length} memberships for class ${classId}`);
      
      // Créer un Map des memberships pour un accès facile par userId
      const membershipMap = new Map();
      memberships.forEach(membership => {
        membershipMap.set(membership.userId.toString(), membership);
      });
      
      // Extraire les IDs utilisateurs des adhésions
      const userIds = memberships.map(membership => membership.userId);
      
      // Récupérer tous les utilisateurs correspondants et ajouter leur rôle
      const usersWithRoles: LimitedUserWithRole[] = [];
      for (const userId of userIds) {
        const user = await this.userRepository.findById(userId.toString());
        if (user) {
          const membership = membershipMap.get(userId.toString());
          
          // Ne retourner que les informations limitées pour chaque utilisateur
          const userWithRole: LimitedUserWithRole = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            avatarUrl: user.avatarUrl,
            membershipRole: membership ? membership.role : undefined
          };
          
          usersWithRoles.push(userWithRole);
        }
      }
      
      this.logger.debug(`Found ${usersWithRoles.length} users for class ${classId}`);
      return usersWithRoles;
      
    } catch (error) {
      this.logger.error(`Error finding users for class ${classId}: ${error.message}`, error.stack);
      return [];
    }
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