import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { getCorsOptions } from './common/middlewares/cookie-config';
import { AUTH_CONSTANTS } from './modules/auth/auth.constants';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const logger = new Logger('Main');
  const isProduction = process.env.NODE_ENV === 'production';

  // Spécifier le type d'application comme NestExpressApplication pour accéder aux méthodes spécifiques d'Express
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });
  
  const configService = app.get(ConfigService);
  
  // Configure cookie parser middleware
  app.use(cookieParser(configService.get<string>('auth.jwtSecret') || 'metacopi_jwt_secret'));
  logger.log('Cookie parser middleware configured');
  
  // Préfixe global pour toutes les routes API
  app.setGlobalPrefix('api');
  logger.log('All API routes are now prefixed with /api');
  
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
  // Mise à jour du chemin Swagger pour respecter le préfixe /api
  SwaggerModule.setup('api/docs', app, document);

  // Configure CORS with cookie credentials
  const corsOptions = getCorsOptions(configService);
  app.enableCors(corsOptions);
  logger.log('CORS configured with cookie credentials support');

  // Configuration pour servir l'application frontend
  const frontendBuildPath = configService.get<string>('FRONTEND_BUILD_PATH') || '../metacopi-ui/build';
  
  // Vérifier si le chemin est absolu ou relatif
  const absoluteFrontendPath = frontendBuildPath.startsWith('/') 
    ? frontendBuildPath 
    : join(process.cwd(), frontendBuildPath);
  
  // Servir les fichiers statiques de l'application React
  app.useStaticAssets(absoluteFrontendPath);
  logger.log(`Serving static frontend files from: ${absoluteFrontendPath}`);
  
  // Catch-all route pour rediriger vers index.html (SPA support)
  app.use((req, res, next) => {
    // Ne pas intercepter les routes /api
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    // Servir index.html pour toutes les autres routes
    res.sendFile(join(absoluteFrontendPath, 'index.html'));
  });

  const port = parseInt(process.env.PORT || '3002', 10);
  const host = isProduction ? '0.0.0.0' : 'localhost';

  await app.listen(port, host);
  logger.log(`Application is running on: http://${host}:${port}`);
  logger.log(`API is available at: http://${host}:${port}/api`);
  if (!isProduction) {
    logger.log(`API documentation available at: http://${host}:${port}/api/docs`);
  }
}
bootstrap(); 
