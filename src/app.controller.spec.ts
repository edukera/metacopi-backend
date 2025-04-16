import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseService } from './database/database.service';

// Mock du DatabaseService
class DatabaseServiceMock {
  async getStatus() {
    return {
      status: 'connected',
      dbName: 'test',
      host: 'localhost',
      port: 27017,
    };
  }
}

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: DatabaseService, useClass: DatabaseServiceMock },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Welcome to metacopi!"', () => {
      expect(appController.getHello()).toBe('Welcome to metacopi!');
    });
  });

  describe('db-status', () => {
    it('should return database status', async () => {
      const result = await appController.getDatabaseStatus();
      expect(result).toHaveProperty('status');
      expect(result.status).toBe('connected');
    });
  });
}); 