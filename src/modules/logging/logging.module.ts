import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { join } from 'path';

@Module({
  imports: [
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get('NODE_ENV') === 'production';
        const logDir = configService.get('LOG_DIR', 'logs');
        
        // Format for console logs
        const consoleFormat = winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, context, trace, ...meta }) => {
            return `${timestamp} [${context || 'Application'}] ${level}: ${message}${
              Object.keys(meta).length ? `\nMeta: ${JSON.stringify(meta, null, 2)}` : ''
            }${trace ? `\n${trace}` : ''}`;
          }),
        );

        // Format for file logs
        const fileFormat = winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        );

        // Configuration for daily rotating file transport
        const dailyRotateTransport = new DailyRotateFile({
          dirname: join(process.cwd(), logDir),
          filename: 'application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          format: fileFormat,
        });

        // Configuration for daily rotating error logs
        const errorRotateTransport = new DailyRotateFile({
          dirname: join(process.cwd(), logDir),
          filename: 'error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          level: 'error',
          format: fileFormat,
        });

        return {
          transports: [
            new winston.transports.Console({
              format: consoleFormat,
              level: isProduction ? 'info' : 'debug',
            }),
            ...(isProduction ? [dailyRotateTransport, errorRotateTransport] : []),
          ],
        };
      },
    }),
  ],
  exports: [WinstonModule],
})
export class LoggingModule {} 