import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Membership, MembershipRole, MembershipStatus } from './membership.schema';
import { CreateMembershipDto, UpdateMembershipDto } from './membership.dto';

@Injectable()
export class MembershipService {
  private readonly logger = new Logger(MembershipService.name);

  constructor(
    @InjectModel(Membership.name) private membershipModel: Model<Membership>,
  ) {}

  async create(createMembershipDto: CreateMembershipDto): Promise<Membership> {
    const newMembership = new this.membershipModel(createMembershipDto);
    return newMembership.save();
  }

  async findAll(): Promise<Membership[]> {
    return this.membershipModel.find().exec();
  }

  async findOne(id: string): Promise<Membership> {
    return this.membershipModel.findById(id).exec();
  }

  async findByUser(userId: string): Promise<Membership[]> {
    this.logger.log(`Finding memberships for user: ${userId}, type: ${typeof userId}`);
    
    try {
      // Ensure userId is a valid ObjectId
      if (!Types.ObjectId.isValid(userId)) {
        this.logger.warn(`Invalid userId format: ${userId}`);
        return [];
      }
      
      // Convert string userId to ObjectId
      const userObjectId = new Types.ObjectId(userId);
      this.logger.log(`User ObjectId: ${userObjectId}`);
      
      // Perform DB query with explicit userId field comparison
      const memberships = await this.membershipModel.find({ 
        userId: userObjectId 
      }).exec();
      
      this.logger.log(`Found ${memberships.length} memberships for user ${userId}`);
      if (memberships.length > 0) {
        this.logger.debug(`First membership: ${JSON.stringify(memberships[0])}`);
      }
      
      return memberships;
    } catch (error) {
      this.logger.error(`Error finding memberships for user ${userId}: ${error.message}`, error.stack);
      return [];
    }
  }

  async findByClass(classId: string): Promise<Membership[]> {
    const classObjectId = new Types.ObjectId(classId);
    return this.membershipModel.find({ classId: classObjectId }).exec();
  }

  async findByUserAndClass(userId: string, classId: string): Promise<Membership | null> {
    const userObjectId = new Types.ObjectId(userId);
    const classObjectId = new Types.ObjectId(classId);
    return this.membershipModel.findOne({ 
      userId: userObjectId, 
      classId: classObjectId 
    }).exec();
  }

  async update(id: string, updateMembershipDto: UpdateMembershipDto): Promise<Membership> {
    return this.membershipModel
      .findByIdAndUpdate(id, updateMembershipDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Membership> {
    return this.membershipModel.findByIdAndDelete(id).exec();
  }

  async deleteByClass(classId: string): Promise<void> {
    await this.membershipModel.deleteMany({ classId }).exec();
  }

  /**
   * Vérifie si un utilisateur possède un rôle spécifique dans une classe donnée
   * @param userId ID de l'utilisateur
   * @param classId ID de la classe
   * @param role Rôle à vérifier (TEACHER ou STUDENT)
   * @returns true si l'utilisateur a le rôle spécifié, false sinon
   */
  async checkMembershipRole(userId: string, classId: string, role: MembershipRole): Promise<boolean> {
    this.logger.debug(`Checking if user ${userId} has role ${role} in class ${classId}`);
    
    try {
      if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(classId)) {
        this.logger.warn(`Invalid userId or classId format: userId=${userId}, classId=${classId}`);
        return false;
      }

      const userObjectId = new Types.ObjectId(userId);
      const classObjectId = new Types.ObjectId(classId);

      const membership = await this.membershipModel.findOne({
        userId: userObjectId,
        classId: classObjectId,
        role: role,
        status: MembershipStatus.ACTIVE,
        isActive: true
      }).exec();

      return !!membership;
    } catch (error) {
      this.logger.error(`Error checking membership role: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Vérifie si un utilisateur est enseignant pour une tâche spécifique
   * @param userId ID de l'utilisateur
   * @param taskId ID de la tâche
   * @returns true si l'utilisateur est enseignant de la classe associée à la tâche, false sinon
   */
  async isTeacherForTask(userId: string, taskId: string, taskService: any): Promise<boolean> {
    this.logger.debug(`Checking if user ${userId} is teacher for task ${taskId}`);
    
    try {
      // 1. Trouver la tâche pour obtenir le classId
      const task = await taskService.findById(taskId).exec();
      if (!task) {
        return false;
      }
      
      // 2. Vérifier si l'utilisateur est enseignant de cette classe
      return this.checkMembershipRole(userId, task.classId, MembershipRole.TEACHER);
    } catch (error) {
      this.logger.error(`Error checking teacher status for task: ${error.message}`, error.stack);
      return false;
    }
  }
} 