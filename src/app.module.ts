import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClassModule } from './modules/classes/class.module';
import { MembershipModule } from './modules/memberships/membership.module';
import { TaskModule } from './modules/tasks/task.module';
import { SubmissionModule } from './modules/submissions/submission.module';
import { CorrectionModule } from './modules/corrections/correction.module';
import { CommentModule } from './modules/comments/comment.module';
import { AuditLogModule } from './modules/audit-logs/audit-log.module';
import { StorageModule } from './modules/storage/storage.module';
import { LoggingModule, LoggingInterceptor, HttpExceptionFilter } from './modules/logging';
import { TaskResourceModule } from './modules/task-resources/task-resource.module';
import { ValidatorsModule } from './common/validators/validators.module';
import { JwtAuthGuard } from './common/guards';
import { GuardsModule } from './common/guards.module';
import { AuditLogInterceptor } from './common/interceptors';
import { AnnotationModule } from './modules/annotations/annotation.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    UsersModule,
    AuthModule,
    ClassModule,
    MembershipModule,
    TaskModule,
    SubmissionModule,
    CorrectionModule,
    CommentModule,
    AuditLogModule,
    LoggingModule,
    StorageModule,
    TaskResourceModule,
    GuardsModule,
    ValidatorsModule,
    AnnotationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply the JWT guard globally
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Apply the audit interceptor globally
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
    // Apply the logging interceptor globally
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // Apply the HTTP exception filter globally
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {} 