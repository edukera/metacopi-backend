import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { getCorsOptions } from './common/middlewares/cookie-config';
import { AUTH_CONSTANTS } from './modules/auth/auth.constants';

async function bootstrap() {
  const logger = new Logger('Main');
  const isProduction = process.env.NODE_ENV === 'production';

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });
  
  const configService = app.get(ConfigService);
  
  // Configure cookie parser middleware
  app.use(cookieParser(configService.get<string>('auth.jwtSecret') || 'metacopi_jwt_secret'));
  logger.log('Cookie parser middleware configured');
  
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
    .addCookieAuth(
      AUTH_CONSTANTS.COOKIE_NAMES.REFRESH_TOKEN,
      {
        type: 'apiKey',
        in: 'cookie',
        name: AUTH_CONSTANTS.COOKIE_NAMES.REFRESH_TOKEN,
      },
      AUTH_CONSTANTS.COOKIE_NAMES.REFRESH_TOKEN
    )
    .addTag('users', 'User management')
    .addTag('auth', 'Authentication and authorization')
    .addTag('classes', 'Class management')
    .addTag('memberships', 'Membership management')
    .addTag('tasks', 'Task management')
    .addTag('submissions', 'Submission management')
    .addTag('corrections', 'Correction management')
    .addTag('comments', 'Comment management')
    .addTag('annotations', 'Annotation management')
    .addTag('task-resources', 'Task resource management')
    .addTag('audit-logs', 'Audit logs management')
    .addTag('storage', 'S3 storage management')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // Configure CORS with cookie credentials
  const corsOptions = getCorsOptions(configService);
  app.enableCors(corsOptions);
  logger.log('CORS configured with cookie credentials support');

  const port = parseInt(process.env.PORT || '3002', 10);
  const host = isProduction ? '0.0.0.0' : 'localhost';

  await app.listen(port, host);
  logger.log(`Application is running on: http://${host}:${port}`);
  if (!isProduction) {
    logger.log(`API documentation available at: http://${host}:${port}/api-docs`);
  }
}
bootstrap(); 
