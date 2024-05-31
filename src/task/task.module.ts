import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { ScheduleModule } from '@nestjs/schedule';
import { UserModule } from '../user/user.module';
import { TaskController } from './task.controller';

@Module({
  imports: [ScheduleModule.forRoot(), UserModule],
  providers: [TaskService],
  controllers: [TaskController],
})
export class TaskModule {}
