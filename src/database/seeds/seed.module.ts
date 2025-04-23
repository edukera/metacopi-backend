import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminSeedService } from './admin.seed';
import { UsersSeedService } from './users.seed';
import { DataSeedService } from './data-seed.service';
import { User, UserSchema } from '../../modules/users/user.schema';
import { Class, ClassSchema } from '../../modules/classes/class.schema';
import { Task, TaskSchema } from '../../modules/tasks/task.schema';
import { Membership, MembershipSchema } from '../../modules/memberships/membership.schema';
import { DatabaseModule } from '../database.module';
import { ConfigModule } from '../../config/config.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Class.name, schema: ClassSchema },
      { name: Task.name, schema: TaskSchema },
      { name: Membership.name, schema: MembershipSchema },
    ]),
  ],
  providers: [AdminSeedService, UsersSeedService, DataSeedService],
  exports: [AdminSeedService, UsersSeedService, DataSeedService],
})
export class SeedModule {} 