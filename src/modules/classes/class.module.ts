import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Class, ClassSchema } from './class.schema';
import { ClassService } from './class.service';
import { ClassController } from './class.controller';
import { MembershipModule } from '../memberships/membership.module';
import { Membership, MembershipSchema } from '../memberships/membership.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Class.name, schema: ClassSchema },
      { name: Membership.name, schema: MembershipSchema },
    ]),
    MembershipModule,
  ],
  controllers: [ClassController],
  providers: [ClassService],
  exports: [ClassService, MongooseModule],
})
export class ClassModule {} 