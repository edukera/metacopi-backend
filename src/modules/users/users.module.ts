import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user.schema';
import { MongoUserRepository } from './user.repository';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { Membership, MembershipSchema } from '../memberships/membership.schema';
import { ClassAccessGuard } from '../../common/guards';
import { MembershipService } from '../memberships/membership.service';
import { MembershipModule } from '../memberships/membership.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Membership.name, schema: MembershipSchema },
    ]),
    forwardRef(() => MembershipModule),
  ],
  controllers: [UserController],
  providers: [
    MongoUserRepository,
    UserService,
    ClassAccessGuard,
    MembershipService,
  ],
  exports: [
    UserService,
    MongoUserRepository,
  ],
})
export class UsersModule {} 