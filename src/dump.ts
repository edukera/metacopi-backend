import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DumpModule } from './database/dump/dump.module';
import { DumpService } from './database/dump/dump.service';

/**
 * Script pour exporter les données de la base de données vers un fichier JSON
 * Usage: npm run dump [chemin-fichier]
 */
async function bootstrap() {
  const logger = new Logger('Dump');
  
  try {
    logger.log('Starting database dump process...');
    
    const app = await NestFactory.createApplicationContext(DumpModule);
    
    // Récupérer le service de dump
    const dumpService = app.get(DumpService);
    
    // Vérifier si un chemin de fichier a été spécifié
    const outputPath = process.argv[2];
       
    // Exécuter le dump avec le chemin spécifié ou le chemin par défaut
    await dumpService.dump(outputPath);
    
    logger.log('Dump process completed successfully!');
    
    await app.close();
    process.exit(0);
  } catch (error) {
    logger.error(`Error during database dump: ${error.message}`);
    process.exit(1);
  }
}

// Exécuter le script
bootstrap(); 