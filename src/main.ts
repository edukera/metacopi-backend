import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Main');

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('port');
  
  // Ajouter la validation globale
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Configuration Swagger
  const config = new DocumentBuilder()
    .setTitle('Metacopi API')
    .setDescription('Metacopi Backend API Documentation')
    .setVersion('1.0')
    .addBearerAuth(
      { 
        type: 'http', 
        scheme: 'bearer', 
        bearerFormat: 'JWT',
        in: 'header'
      },
      'JWT-auth'
    )
    .addTag('users', 'User management')
    .addTag('auth', 'Authentication and authorization')
    .addTag('classes', 'Class management')
    .addTag('memberships', 'Membership management')
    .addTag('tasks', 'Task management')
    .addTag('submissions', 'Submission management')
    .addTag('corrections', 'Correction management')
    .addTag('task-resources', 'Task resource management')
    .addTag('audit-logs', 'Audit logs management')
    .addTag('storage', 'S3 storage management')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // CORS
  app.enableCors();
  
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`API documentation available at: http://localhost:${port}/api-docs`);
}
bootstrap(); 