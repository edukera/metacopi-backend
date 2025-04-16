import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Class, ClassSchema } from './class.schema';
import { ClassService } from './class.service';
import { ClassController } from './class.controller';
import { MembershipModule } from '../memberships/membership.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Class.name, schema: ClassSchema },
    ]),
    MembershipModule,
  ],
  controllers: [ClassController],
  providers: [ClassService],
  exports: [ClassService],
})
export class ClassModule {} 