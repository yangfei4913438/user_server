import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { RoleConsumer } from './role.consumer';
import { PermissionModule } from '../permission/permission.module';

@Module({
  imports: [PermissionModule],
  providers: [RoleService, RoleConsumer],
  controllers: [RoleController],
  exports: [RoleService],
})
export class RoleModule {}
