import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { RoleConsumer } from './role.consumer';

@Module({
  providers: [RoleService, RoleConsumer],
  controllers: [RoleController],
})
export class RoleModule {}
