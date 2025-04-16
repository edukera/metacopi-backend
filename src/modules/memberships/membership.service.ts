import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Membership } from './membership.schema';
import { CreateMembershipDto, UpdateMembershipDto } from './membership.dto';

@Injectable()
export class MembershipService {
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
    return this.membershipModel.find({ userId }).exec();
  }

  async findByClass(classId: string): Promise<Membership[]> {
    return this.membershipModel.find({ classId }).exec();
  }

  async findByUserAndClass(userId: string, classId: string): Promise<Membership | null> {
    return this.membershipModel.findOne({ userId, classId }).exec();
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
} 