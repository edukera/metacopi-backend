import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskResourceController } from './task-resource.controller';
import { TaskResourceService } from './task-resource.service';
import { TaskResource, TaskResourceSchema } from './task-resource.schema';
import { TaskModule } from '../tasks/task.module';
import { MembershipModule } from '../memberships/membership.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TaskResource.name, schema: TaskResourceSchema },
    ]),
    TaskModule,
    MembershipModule,
  ],
  controllers: [TaskResourceController],
  providers: [TaskResourceService],
  exports: [TaskResourceService],
})
export class TaskResourceModule {} 