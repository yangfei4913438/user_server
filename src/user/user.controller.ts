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
import { Request } from 'express';
import { UserService } from './user.service';
import { UpdateUserDto, UserReturn } from './dto/user.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('list')
  @ApiOperation({ summary: '获取用户列表' })
  @ApiResponse({ status: 200, description: '获取用户列表', type: [UserReturn] })
  async getUsers(): Promise<UserReturn[]> {
    return await this.userService.findAllUsers();
  }

  @Get()
  @ApiOperation({ summary: '获取用户信息' })
  @ApiResponse({
    status: 200,
    description: '获取用户信息',
    type: UserReturn,
  })
  async getUser(@Req() request: Request): Promise<UserReturn | null> {
    const id = request['user_id'];
    return await this.userService.findUserById(id);
  }

  @Put()
  @ApiOperation({ summary: '更新用户' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: '更新用户数据，返回更新后的数据',
    type: UserReturn,
  })
  async updateUser(
    @Req() request: Request,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserReturn> {
    const id = request['user_id'];
    return await this.userService.updateUser(id, updateUserDto);
  }

  @Delete()
  @ApiOperation({ summary: '注销用户' })
  async deactivateUser(@Req() request: Request): Promise<UserReturn> {
    const id = request['user_id'];
    return await this.userService.cancelUser(id);
  }

  @Post('/roles/:id')
  @ApiOperation({ summary: '给用户添加角色' })
  async addRoles(
    @Req() request: Request,
    @Param('id') target_user_id: string, // 目标用户
    @Body() ids: string[],
  ) {
    // 操作用户
    const user_id = request['user_id'];
    // 这里我就不处理用户权限的判断了，使用的人可以对权限做进一步的判断。
    // 比如只有管理员才可以对别人的角色进行操作。非管理员不能操作角色等等。
    return await this.userService.createRoles(user_id, target_user_id, ids);
  }

  @Get('/roles/:id')
  @ApiOperation({ summary: '获取用户的角色列表' })
  async getRoles(@Param('id') target_user_id: string) {
    return await this.userService.getUserRoles(target_user_id);
  }

  @Put('/roles/:id')
  @ApiOperation({ summary: '更新用户的角色' })
  async updateUserRole(
    @Req() request: Request,
    @Param('id') target_user_id: string,
    @Body() ids: string[],
  ) {
    // 操作用户
    const user_id = request['user_id'];
    return await this.userService.updateUserRoles(user_id, target_user_id, ids);
  }
}
