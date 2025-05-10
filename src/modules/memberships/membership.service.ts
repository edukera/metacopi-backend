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

  async findByUserEmail(userEmail: string): Promise<Membership[]> {
    this.logger.log(`Finding memberships for user email: ${userEmail}, type: ${typeof userEmail}`);
    
    try {
      // Perform DB query with explicit userId field comparison
      const memberships = await this.membershipModel.find({ 
        email: userEmail
      }).exec();
      
      this.logger.log(`Found ${memberships.length} memberships for user ${userEmail}`);
      if (memberships.length > 0) {
        this.logger.debug(`First membership: ${JSON.stringify(memberships[0])}`);
      }
      
      return memberships;
    } catch (error) {
      this.logger.error(`Error finding memberships for user ${userEmail}: ${error.message}`, error.stack);
      return [];
    }
  }

  async findByClass(classId: string): Promise<Membership[]> {
    return this.membershipModel.find({ classId: classId }).exec();
  }

  async findByUserAndClass(email: string, classId: string): Promise<Membership | null> {
    return this.membershipModel.findOne({ 
      email: email, 
      classId: classId 
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
  async checkMembershipRole(userEmail: string, classId: string, role: MembershipRole): Promise<boolean> {
    this.logger.debug(`Checking if user ${userEmail} has role ${role} in class ${classId}`);
    
    try {
      const membership = await this.membershipModel.findOne({
        email: userEmail,
        classId: classId,
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
   * @param userEmail Email de l'utilisateur
   * @param taskId ID de la tâche
   * @returns true si l'utilisateur est enseignant de la classe associée à la tâche, false sinon
   */
  async isTeacherForTask(userEmail: string, taskId: string, taskService: any): Promise<boolean> {
    this.logger.debug(`Checking if user ${userEmail} is teacher for task ${taskId}`);
    try {
      // 1. Trouver la tâche pour obtenir le classId
      const task = await taskService.findById(taskId).exec();
      if (!task) {
        return false;
      }
      // 2. Vérifier si l'utilisateur est enseignant de cette classe
      return this.checkMembershipRole(userEmail, task.classId, MembershipRole.TEACHER);
    } catch (error) {
      this.logger.error(`Error checking teacher status for task: ${error.message}`, error.stack);
      return false;
    }
  }
} 