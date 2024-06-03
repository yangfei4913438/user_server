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
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Role, RoleDto, RoleUpdateDto } from './dto/role.dto';
import { Request } from 'express';

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
}
