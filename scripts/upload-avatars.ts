#!/usr/bin/env node

/**
 * Script pour uploader les avatars des étudiants vers AWS S3
 * Lit les données depuis avatars/data.json et upload les fichiers JPG correspondants
 * Met à jour le fichier seed-data.json avec les URLs S3 des avatars
 */

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageService, StorageFolderType } from '../src/modules/storage/storage.service';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

// Interface pour les données d'avatar
interface AvatarData {
  firstname: string;
  lastname: string;
  photo: string;
  birthdate: string;
}

// Interface pour les données de seed
interface UserSeedData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  role: string;
  emailVerified: boolean;
}

interface SeedData {
  users: UserSeedData[];
  [key: string]: any; // Pour les autres propriétés du fichier seed
}

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
class UploadAvatarsModule {}

class AvatarUploadService {
  private readonly logger = new Logger('AvatarUpload');

  constructor(private readonly storageService: StorageService) {}

  async uploadAvatars(): Promise<void> {
    try {
      // 1. Lire le fichier data.json des avatars
      const dataPath = path.resolve('avatars/data.json');
      if (!fs.existsSync(dataPath)) {
        throw new Error(`File not found: ${dataPath}`);
      }

      const avatarData: AvatarData[] = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      this.logger.log(`Found ${avatarData.length} avatar records`);

      // 2. Lire le fichier seed-data.json
      const seedDataPath = path.resolve('src/database/seeds/data/seed-data.json');
      if (!fs.existsSync(seedDataPath)) {
        throw new Error(`Seed data file not found: ${seedDataPath}`);
      }

      const seedData: SeedData = JSON.parse(fs.readFileSync(seedDataPath, 'utf8'));
      this.logger.log(`Found ${seedData.users.length} users in seed data`);

      // 3. Pour chaque avatar, uploader vers S3 et mettre à jour seed-data.json
      for (const avatar of avatarData) {
        await this.uploadSingleAvatar(avatar, seedData);
      }

      // 4. Sauvegarder le fichier seed-data.json mis à jour
      fs.writeFileSync(seedDataPath, JSON.stringify(seedData, null, 2), 'utf8');
      this.logger.log(`📝 Updated seed-data.json with avatar URLs`);

      this.logger.log('✅ All avatars uploaded successfully!');
    } catch (error) {
      this.logger.error('❌ Error during avatar upload:', error);
      throw error;
    }
  }

  private async uploadSingleAvatar(avatar: AvatarData, seedData: SeedData): Promise<void> {
    try {
      const imagePath = path.resolve('avatars', avatar.photo);
      
      // Vérifier que le fichier existe
      if (!fs.existsSync(imagePath)) {
        this.logger.warn(`⚠️  Image not found: ${imagePath}`);
        return;
      }

      // Générer un nom de fichier unique basé sur le nom (normalisé)
      const sanitizedName = `${avatar.firstname}_${avatar.lastname}`.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_');
      const fileExtension = path.extname(avatar.photo);
      const newFilename = `${sanitizedName}${fileExtension}`;

      // Générer la clé S3
      const s3Key = this.storageService.generateKey(
        StorageFolderType.AVATARS,
        newFilename
      );

      // Obtenir une URL signée pour l'upload
      const uploadUrl = await this.storageService.getPresignedUploadUrl(
        s3Key,
        'image/jpeg',
        3600
      );

      // Lire le fichier
      const fileBuffer = fs.readFileSync(imagePath);

      // Uploader vers S3 via l'URL signée
      await axios.put(uploadUrl, fileBuffer, {
        headers: {
          'Content-Type': 'image/jpeg',
        },
      });

      this.logger.log(`✅ Uploaded: ${avatar.firstname} ${avatar.lastname} -> ${s3Key}`);

      // Mettre à jour le fichier seed-data.json
      await this.updateSeedDataAvatar(avatar, s3Key, seedData);

    } catch (error) {
      this.logger.error(`❌ Failed to upload ${avatar.firstname} ${avatar.lastname}:`, error.message);
    }
  }

  private async updateSeedDataAvatar(avatar: AvatarData, s3Key: string, seedData: SeedData): Promise<void> {
    try {
      // Chercher l'utilisateur dans seed-data.json par nom et prénom
      const user = seedData.users.find(u => 
        u.firstName.toLowerCase() === avatar.firstname.toLowerCase() &&
        u.lastName.toLowerCase() === avatar.lastname.toLowerCase()
      );

      if (user) {
        // Mettre à jour l'avatarUrl avec la clé S3
        user.avatarUrl = s3Key;
        this.logger.log(`📝 Updated seed data for: ${user.firstName} ${user.lastName} (${user.email})`);
      } else {
        this.logger.warn(`👤 User not found in seed data: ${avatar.firstname} ${avatar.lastname}`);
      }
    } catch (error) {
      this.logger.warn(`⚠️  Could not update seed data: ${error.message}`);
    }
  }
}

async function bootstrap() {
  const logger = new Logger('AvatarUploadScript');
  
  try {
    logger.log('🚀 Starting avatar upload process...');
    
    const app = await NestFactory.createApplicationContext(UploadAvatarsModule);
    
    const storageService = app.get(StorageService);
    
    const uploadService = new AvatarUploadService(storageService);
    await uploadService.uploadAvatars();
    
    await app.close();
    process.exit(0);
  } catch (error) {
    logger.error(`💥 Script failed: ${error.message}`);
    process.exit(1);
  }
}

// Exécuter le script
bootstrap();
