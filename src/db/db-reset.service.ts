import { Injectable, Logger } from '@nestjs/common';
import { DataSeedService } from '../database/seeds/data-seed.service';

@Injectable()
export class DbResetService {
  private readonly logger = new Logger(DbResetService.name);

  constructor(private readonly dataSeedService: DataSeedService) {}

  /**
   * Resets the database to its initial state with seed data
   * @returns Promise that resolves when the reset is complete
   */
  async resetDatabase(): Promise<void> {
    try {
      this.logger.log('Starting database reset process...');
      await this.dataSeedService.seed();
      this.logger.log('Database reset completed successfully!');
    } catch (error) {
      this.logger.error(`Error during database reset: ${error.message}`);
      throw error;
    }
  }
} 