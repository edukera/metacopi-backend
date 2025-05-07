import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Membership, MembershipSchema } from './membership.schema';
import { MembershipService } from './membership.service';
import { MembershipController } from './membership.controller';
import { MembershipAccessGuard } from '../../common/guards';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Membership.name, schema: MembershipSchema },
    ]),
  ],
  controllers: [MembershipController],
  providers: [MembershipService, MembershipAccessGuard],
  exports: [MembershipService],
})
export class MembershipModule {} 