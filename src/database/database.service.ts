import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async onModuleInit() {
    try {
      if (this.connection.readyState === 1) {
        this.logger.log('Successfully connected to MongoDB');
      } else {
        this.logger.error('Failed to connect to MongoDB');
      }
    } catch (error) {
      this.logger.error(`Database connection error: ${error.message}`);
    }
  }

  async getStatus() {
    return {
      status: this.connection.readyState === 1 ? 'connected' : 'disconnected',
      dbName: this.connection.db.databaseName,
      host: this.connection.host,
      port: this.connection.port,
    };
  }

  getDbHandle(): Connection {
    return this.connection;
  }
} 