import { Module } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { PermissionController } from './permission.controller';
import { PermissionConsumer } from './permission.consumer';

@Module({
  providers: [PermissionService, PermissionConsumer],
  controllers: [PermissionController],
})
export class PermissionModule {}
