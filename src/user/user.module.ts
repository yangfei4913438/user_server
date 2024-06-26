import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserConsumer } from './user.consumer';
import { EmailModule } from '../email/email.module';
import { RoleModule } from '../role/role.module';

@Module({
  imports: [EmailModule, RoleModule],
  providers: [UserService, UserConsumer],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
