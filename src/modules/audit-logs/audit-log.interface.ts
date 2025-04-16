import { Document } from 'mongoose';
import { TargetType } from './audit-log.schema';

export interface AuditLog extends Document {
  readonly userId: string;
  readonly action: string;
  readonly targetType: string;
  readonly targetId: string;
  readonly timestamp: Date;
  readonly metadata: Record<string, any>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface AuditLogRepository {
  create(createAuditLogDto: any): Promise<AuditLog>;
  findAll(filters?: Record<string, any>): Promise<AuditLog[]>;
  findById(id: string): Promise<AuditLog>;
  findByUser(userId: string): Promise<AuditLog[]>;
  findByTarget(targetType: TargetType, targetId: string): Promise<AuditLog[]>;
  findByAction(action: string): Promise<AuditLog[]>;
  remove(id: string): Promise<AuditLog>;
} 