import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Options de configuration
type DatabaseConnectionType = 'memory' | 'test' | 'custom';

interface SetupOptions {
  connectionType?: DatabaseConnectionType;
  customUri?: string;
}

const defaultOptions: SetupOptions = {
  connectionType: 'test', // Utiliser 'test' par défaut au lieu de 'memory'
};

let mongoServer: MongoMemoryServer | null = null;
let connectionUri: string = '';

export const setupMongoDB = async (options: SetupOptions = defaultOptions): Promise<string> => {
  const mergedOptions = { ...defaultOptions, ...options };
  
  switch (mergedOptions.connectionType) {
    case 'memory':
      // Utiliser MongoDB en mémoire (pour des tests hermétiques)
      mongoServer = await MongoMemoryServer.create();
      connectionUri = mongoServer.getUri();
      console.log('Connecting to in-memory MongoDB server');
      break;
      
    case 'test':
      // Utiliser une base de données dédiée aux tests
      connectionUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/metacopi_test';
      console.log(`Connecting to test database: ${connectionUri}`);
      break;
      
    case 'custom':
      // Utiliser une URI personnalisée
      if (!mergedOptions.customUri) {
        throw new Error('customUri is required when connectionType is "custom"');
      }
      connectionUri = mergedOptions.customUri;
      console.log(`Connecting to custom database: ${connectionUri}`);
      break;
      
    default:
      throw new Error(`Unknown connection type: ${mergedOptions.connectionType}`);
  }
  
  await mongoose.connect(connectionUri);
  return connectionUri;
};

export const closeMongoDB = async (): Promise<void> => {
  try {
    // Toujours nettoyer la base de données avant de se déconnecter
    await clearDatabase();
    
    // Fermer la connexion mongoose
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    
    // Arrêter le serveur MongoDB en mémoire si utilisé
    if (mongoServer) {
      await mongoServer.stop();
      mongoServer = null;
    }
    
    console.log('MongoDB connection closed successfully');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    throw error;
  }
};

export const clearDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    try {
      console.log('Clearing database collections...');
      const collections = mongoose.connection.collections;
      
      for (const key in collections) {
        const collection = collections[key];
        try {
          // D'abord essayer de supprimer tous les documents
          await collection.deleteMany({});
          
          // Vérifier si tous les documents ont été effectivement supprimés
          const count = await collection.countDocuments({});
          if (count > 0) {
            console.warn(`Warning: ${count} documents still remain in collection ${key} after deleteMany()`);
            
            // Si des documents persistent, essayer de supprimer la collection
            await collection.drop().catch(err => {
              // Ignorer l'erreur "ns not found" qui peut survenir si la collection n'existe pas
              if (err.message !== 'ns not found') throw err;
            });
          }
        } catch (error) {
          console.error(`Error clearing collection ${key}:`, error);
        }
      }
      console.log('Database cleared successfully');
    } catch (error) {
      console.error('Error clearing database:', error);
      throw error;
    }
  } else {
    console.warn('No active connection to clear database');
  }
}; 