import { Body, Controller, Delete, Get, Param, Put, Req } from '@nestjs/common';
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
}
