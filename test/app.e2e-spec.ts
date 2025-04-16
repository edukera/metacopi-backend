import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { DatabaseService } from '../src/database/database.service';

// Mock du DatabaseService pour les tests e2e
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

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DatabaseService)
      .useClass(DatabaseServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Bienvenue sur metacopi!');
  });

  it('/db-status (GET)', () => {
    return request(app.getHttpServer())
      .get('/db-status')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('status');
        expect(res.body.status).toBe('connected');
      });
  });

  afterAll(async () => {
    await app.close();
  });
}); 