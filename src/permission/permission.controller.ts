import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { PermissionService } from './permission.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  Permission,
  PermissionDto,
  PermissionUpdateDto,
} from './dto/permission.dto';
import { Request } from 'express';

@ApiTags('Permission')
@Controller('permission')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  @ApiOperation({ summary: '创建权限' })
  @ApiResponse({ status: 200, description: '创建用户权限', type: Permission })
  async create(@Body() permissionDto: PermissionDto, @Req() request: Request) {
    const id = request['user_id'];
    return await this.permissionService.create(id, permissionDto);
  }

  @Get('list')
  @ApiOperation({ summary: '创建列表' })
  @ApiResponse({ status: 200, description: '查询权限列表', type: [Permission] })
  async list(): Promise<Permission[]> {
    return await this.permissionService.getPermissions();
  }

  @Put()
  @ApiOperation({ summary: '修改权限' })
  @ApiResponse({
    status: 200,
    description: '根据权限id,修改权限',
    type: Permission,
  })
  async update(
    @Body() permissionUpdateDto: PermissionUpdateDto,
    @Req() request: Request,
  ): Promise<Permission> {
    const id = request['user_id'];
    return await this.permissionService.update(id, permissionUpdateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除权限' })
  @ApiResponse({ status: 200, description: '根据id删除权限', type: Permission })
  async delete(@Req() request: Request, @Param('id') id: string) {
    const user_id = request['user_id'];
    return await this.permissionService.delete(user_id, id);
  }
}
