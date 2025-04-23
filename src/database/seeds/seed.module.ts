import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminSeedService } from './admin.seed';
import { User, UserSchema } from '../../modules/users/user.schema';
import { DatabaseModule } from '../database.module';
import { ConfigModule } from '../../config/config.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [AdminSeedService],
  exports: [AdminSeedService],
})
export class SeedModule {} 