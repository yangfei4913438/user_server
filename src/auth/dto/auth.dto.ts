import { IsNotEmpty } from 'class-validator';

// 登录 DTO
export class AuthLoginDto {
  username?: string;
  email?: string;
  phone?: string;

  @IsNotEmpty({ message: '密码不能为空' })
  password: string;
}

// 注册 DTO
export class AuthRegisterDto extends AuthLoginDto {
  @IsNotEmpty({ message: '昵称不能为空' })
  nickname: string;
  avatar?: string;
  birthday?: string;
  hometown?: string;
}
