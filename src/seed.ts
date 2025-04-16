import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SeedModule } from './database/seeds/seed.module';
import { AdminSeedService } from './database/seeds/admin.seed';

/**
 * Script to initialize the database with essential data
 * Usage: npm run seed
 */
async function bootstrap() {
  const logger = new Logger('Seed');
  
  try {
    logger.log('Starting database initialization process...');
    
    const app = await NestFactory.createApplicationContext(SeedModule);
    
    // Get the seed service
    const adminSeedService = app.get(AdminSeedService);
    
    // Execute seeds
    logger.log('Creating administrator user...');
    await adminSeedService.seed();
    
    logger.log('Initialization process completed successfully!');
    
    await app.close();
    process.exit(0);
  } catch (error) {
    logger.error(`Error during database initialization: ${error.message}`);
    process.exit(1);
  }
}

// Execute the script
bootstrap(); 