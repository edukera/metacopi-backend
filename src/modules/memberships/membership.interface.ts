import { Document } from 'mongoose';
import { MembershipStatus, MembershipRole } from './membership.schema';

export interface Membership extends Document {
  readonly userId: string;
  readonly classId: string;
  readonly role: MembershipRole;
  readonly startDate?: Date;
  readonly endDate?: Date;
  readonly status: MembershipStatus;
  readonly isActive: boolean;
  readonly joinedAt: Date;
  readonly paymentId?: string;
  readonly metadata?: Record<string, any>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface MembershipRepository {
  create(createMembershipDto: any): Promise<Membership>;
  findAll(): Promise<Membership[]>;
  findById(id: string): Promise<Membership>;
  findByUserId(userId: string): Promise<Membership[]>;
  findByClassId(classId: string): Promise<Membership[]>;
  update(id: string, updateMembershipDto: any): Promise<Membership>;
  remove(id: string): Promise<Membership>;
} 