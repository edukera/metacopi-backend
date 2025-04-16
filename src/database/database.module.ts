import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseService } from './database.service';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('database.uri');
        const user = configService.get<string>('database.user');
        const password = configService.get<string>('database.password');
        
        const mongooseOptions: any = {};

        if (user && password) {
          mongooseOptions.auth = {
            username: user,
            password: password,
          };
        }

        return {
          uri,
          ...mongooseOptions,
        };
      },
    }),
  ],
  providers: [DatabaseService],
  exports: [MongooseModule, DatabaseService],
})
export class DatabaseModule {} 