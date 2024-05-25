import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserConsumer } from './user.consumer';
import { EmailService } from '../email/email.service';

@Module({
  providers: [UserService, UserConsumer, EmailService],
  controllers: [UserController],
})
export class UserModule {}
