import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// 登录 DTO, 用户名+密码，邮箱+密码，邮箱+验证码
export class AuthLoginDto {
  @ApiProperty({ description: '登陆的用户名' })
  @IsOptional()
  username: string;

  @ApiProperty({ description: '登陆的用户邮件地址' })
  @IsOptional()
  email: string;

  @ApiProperty({ description: '登陆密码' })
  @IsOptional()
  password: string;

  @ApiProperty({ description: '登陆的邮箱验证码' })
  @IsOptional()
  code: string;
}

// 注册 DTO，注册的时候，必须使用密码注册。
export class AuthRegisterDto extends AuthLoginDto {
  @ApiProperty({ description: '用户昵称' })
  @IsString()
  @IsNotEmpty({ message: '昵称不能为空' })
  nickname: string;

  @ApiProperty({ description: '登陆的用户名' })
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  username: string;

  @ApiProperty({ description: '登陆的邮件地址' })
  @IsNotEmpty({ message: '邮件地址不能为空' })
  @IsEmail({}, { message: '无效的电子邮件地址' })
  email: string;

  @ApiProperty({ description: '用户头像' })
  @IsOptional()
  avatar: string;

  @ApiProperty({ description: '用户生日' })
  @IsOptional()
  birthday: string;

  @ApiProperty({ description: '用户家乡' })
  @IsOptional()
  hometown: string;
}
