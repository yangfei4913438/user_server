import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

// 登录 DTO
export class AuthLoginDto {
  username?: string;
  email?: string;
  phone?: string;

  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  password: string;
}

// 注册 DTO
export class AuthRegisterDto extends AuthLoginDto {
  @IsString()
  @IsNotEmpty({ message: '昵称不能为空' })
  nickname: string;

  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  username: string;

  @IsNotEmpty({ message: '邮件地址不能为空' })
  @IsEmail({}, { message: '无效的电子邮件地址' })
  email: string;

  avatar?: string;
  birthday?: string;
  hometown?: string;
}
