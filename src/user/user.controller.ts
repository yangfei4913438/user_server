import { Body, Controller, Delete, Get, Param, Put } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto, UserReturn } from './dto/user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getUsers(): Promise<UserReturn[]> {
    return await this.userService.findAllUsers();
  }

  @Get(':id')
  async getUser(@Param('id') id: string): Promise<UserReturn | null> {
    return await this.userService.findUserById(id);
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserReturn> {
    return await this.userService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string): Promise<UserReturn> {
    return await this.userService.deleteUser(id);
  }
}
