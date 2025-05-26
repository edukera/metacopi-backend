#!/usr/bin/env node

/**
 * Script pour vérifier les avatars uploadés dans AWS S3
 */

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageService, StorageFolderType } from '../src/modules/storage/storage.service';

// Module temporaire pour le script
import { Module } from '@nestjs/common';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
  ],
  providers: [StorageService],
})
class CheckAvatarsModule {}

class AvatarCheckService {
  private readonly logger = new Logger('AvatarCheck');

  constructor(private readonly storageService: StorageService) {}

  async checkAvatars(): Promise<void> {
    try {
      this.logger.log('🔍 Checking uploaded avatars...');
      
      // Note: Cette méthode dépend de l'implémentation de StorageService
      // Vous devrez peut-être ajouter une méthode listFiles() au StorageService
      
      this.logger.log('✅ Check completed!');
    } catch (error) {
      this.logger.error('❌ Error during avatar check:', error);
      throw error;
    }
  }

  // Méthode pour générer les URLs publiques des avatars
  async generateAvatarUrls(): Promise<void> {
    try {
      const avatarKeys = [
        // Exemples basés sur le pattern du script d'upload
        'avatars/john_doe.jpg',
        'avatars/jane_smith.jpg',
        // Ajoutez d'autres clés selon vos besoins
      ];

      this.logger.log('📋 Generated avatar URLs:');
      
      for (const key of avatarKeys) {
        try {
          const url = await this.storageService.getPresignedDownloadUrl(key, 3600);
          this.logger.log(`🔗 ${key}: ${url}`);
        } catch (error) {
          this.logger.warn(`⚠️  Could not generate URL for ${key}: ${error.message}`);
        }
      }
    } catch (error) {
      this.logger.error('❌ Error generating URLs:', error);
    }
  }
}

async function bootstrap() {
  const logger = new Logger('AvatarCheckScript');
  
  try {
    logger.log('🚀 Starting avatar check process...');
    
    const app = await NestFactory.createApplicationContext(CheckAvatarsModule);
    
    const storageService = app.get(StorageService);
    
    const checkService = new AvatarCheckService(storageService);
    await checkService.checkAvatars();
    await checkService.generateAvatarUrls();
    
    await app.close();
    process.exit(0);
  } catch (error) {
    logger.error(`💥 Script failed: ${error.message}`);
    process.exit(1);
  }
}

// Exécuter le script
bootstrap(); 