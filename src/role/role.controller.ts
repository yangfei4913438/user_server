import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role, RoleDto, RoleUpdateDto } from './dto/role.dto';
import { Request } from 'express';

@ApiTags('Role')
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @ApiOperation({ summary: '创建角色' })
  @ApiResponse({ status: 200, description: '创建用户角色', type: Role })
  async create(@Body() roleDto: RoleDto, @Req() request: Request) {
    const id = request['user_id'];
    return await this.roleService.create(id, roleDto);
  }

  @Get('/list')
  @ApiOperation({ summary: '获取角色列表' })
  @ApiResponse({ status: 200, description: '获取角色列表', type: [Role] })
  async list(): Promise<Role[]> {
    return await this.roleService.getRoles();
  }

  @Put()
  @ApiOperation({ summary: '修改角色' })
  @ApiResponse({
    status: 200,
    description: '根据角色id,修改角色',
    type: Role,
  })
  async update(
    @Body() data: RoleUpdateDto,
    @Req() request: Request,
  ): Promise<Role> {
    const id = request['user_id'];
    return await this.roleService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除角色' })
  @ApiResponse({ status: 200, description: '根据id删除角色', type: Role })
  async delete(@Req() request: Request, @Param('id') id: string) {
    const user_id = request['user_id'];
    return await this.roleService.delete(user_id, id);
  }

  @Post('/add_permissions/:id')
  @ApiOperation({ summary: '添加角色的权限' })
  @ApiResponse({
    status: 200,
    description: '批量添加角色的权限',
    type: Promise<string>,
  })
  async addPermission(
    @Req() request: Request,
    @Param('id') role_id: string,
    @Body() ids: string[],
  ) {
    const user_id = request['user_id'];
    return await this.roleService.addPermissions(user_id, role_id, ids);
  }

  @Put('/update_permissions/:id')
  @ApiOperation({ summary: '修改角色的权限' })
  @ApiResponse({
    status: 200,
    description: '批量修改角色的权限',
    type: Promise<string>,
  })
  async updatePermission(
    @Req() request: Request,
    @Param('id') role_id: string,
    @Body() ids: string[],
  ) {
    const user_id = request['user_id'];
    return await this.roleService.updatePermissions(user_id, role_id, ids);
  }

  @Delete('/clear_permissions/:id')
  @ApiOperation({ summary: '清空角色的权限' })
  @ApiResponse({
    status: 200,
    description: '批量清空角色的所有权限',
    type: Promise<string>,
  })
  async clearPermission(@Req() request: Request, @Param('id') role_id: string) {
    const user_id = request['user_id'];
    return await this.roleService.clearPermissions(user_id, role_id);
  }

  @Get('/permissions/:id')
  @ApiOperation({ summary: '获取角色的权限列表' })
  @ApiResponse({
    status: 200,
    description: '获取角色的权限列表',
    type: Promise<string[]>,
  })
  async getRolePermissions(@Param('id') role_id: string) {
    return await this.roleService.getRolePermissions(role_id);
  }
}
