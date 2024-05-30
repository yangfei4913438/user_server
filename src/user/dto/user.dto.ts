import { IsNotEmpty } from 'class-validator';
import { User } from '@prisma/client';

export interface UserReturn extends Omit<User, 'password'> {}

export class CreateUserDto {
  @IsNotEmpty({ message: '昵称不能为空' })
  nickname: string;
  avatar?: string;
  birthday?: string;
  hometown?: string;

  username?: string;
  email: string;
  phone?: string;

  @IsNotEmpty({ message: '密码不能为空' })
  password: string;
}

export class UpdateUserDto {
  nickname?: string;
  avatar?: string;
  birthday?: string;
  hometown?: string;

  username?: string;
  email?: string;
  phone?: string;
  password?: string;
}
