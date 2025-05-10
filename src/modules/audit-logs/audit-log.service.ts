import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { AuditLog, TargetType } from './audit-log.schema';
import { CreateAuditLogDto, FindAuditLogsDto } from './audit-log.dto';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLog>,
    @Inject(REQUEST) private request,
  ) {}

  async create(createAuditLogDto: CreateAuditLogDto): Promise<AuditLog> {
    // If email is not provided, use current user
    if (!createAuditLogDto.email && this.request.user) {
      createAuditLogDto.email = this.request.user.email;
    }

    // Ensure timestamp is defined
    if (!createAuditLogDto.timestamp) {
      createAuditLogDto.timestamp = new Date();
    }

    const newAuditLog = new this.auditLogModel(createAuditLogDto);
    return newAuditLog.save();
  }

  async findAll(filters?: FindAuditLogsDto): Promise<AuditLog[]> {
    const query: any = {};

    if (filters) {
      if (filters.email) query.email = filters.email;
      if (filters.action) query.action = filters.action;
      if (filters.targetType) query.targetType = filters.targetType;
      if (filters.targetId) query.targetId = filters.targetId;

      // Date range handling
      if (filters.fromDate || filters.toDate) {
        query.timestamp = {};
        if (filters.fromDate) query.timestamp.$gte = filters.fromDate;
        if (filters.toDate) query.timestamp.$lte = filters.toDate;
      }
    }

    return this.auditLogModel.find(query)
      .sort({ timestamp: -1 })
      .limit(100)  // By default, limit to 100 results
      .exec();
  }

  async findById(id: string): Promise<AuditLog> {
    const auditLog = await this.auditLogModel.findById(id).exec();
    if (!auditLog) {
      throw new NotFoundException(`Audit log with ID ${id} not found`);
    }
    return auditLog;
  }

  async findByUser(email: string): Promise<AuditLog[]> {
    return this.auditLogModel.find({ email }).exec();
  }

  async findByTarget(targetType: TargetType, targetId: string): Promise<AuditLog[]> {
    return this.auditLogModel.find({ targetType, targetId })
      .sort({ timestamp: -1 })
      .exec();
  }

  async findByAction(action: string): Promise<AuditLog[]> {
    return this.auditLogModel.find({ action })
      .sort({ timestamp: -1 })
      .limit(100)
      .exec();
  }

  async remove(id: string): Promise<AuditLog> {
    const deletedAuditLog = await this.auditLogModel
      .findByIdAndDelete(id)
      .exec();
    if (!deletedAuditLog) {
      throw new NotFoundException(`Audit log with ID ${id} not found`);
    }
    return deletedAuditLog;
  }
} 