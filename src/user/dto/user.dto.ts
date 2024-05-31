import { IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserReturn {
  @ApiProperty({ description: '用户ID' })
  id: string;

  @ApiProperty({ description: '用户头像' })
  avatar: string;

  @ApiProperty({ description: '登陆用户名' })
  username: string;

  @ApiProperty({ description: '登陆的邮件地址' })
  email: string;

  @ApiProperty({ description: '用户手机号' })
  phone: string;

  @ApiProperty({ description: '用户昵称' })
  nickname: string;

  @ApiProperty({ description: '用户家乡' })
  hometown: string;

  @ApiProperty({ description: '用户生日' })
  birthday: Date | null;

  @ApiProperty({ description: '用户的创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '用户的更新时间' })
  updatedAt: Date;

  @ApiProperty({ description: '用户的注销时间' })
  deletedAt: Date | null;
}

export class UpdateUserDto {
  @ApiProperty({ description: '用户昵称', required: false })
  @IsOptional()
  nickname: string;

  @ApiProperty({ description: '用户头像', required: false })
  @IsOptional()
  avatar: string;

  @ApiProperty({ description: '用户生日', required: false })
  @IsOptional()
  birthday: string;

  @ApiProperty({ description: '用户家乡', required: false })
  @IsOptional()
  hometown: string;

  @ApiProperty({ description: '登陆用户名', required: false })
  @IsOptional()
  username: string;

  @ApiProperty({ description: '登陆的邮件地址', required: false })
  @IsOptional()
  email: string;

  @ApiProperty({ description: '用户手机号', required: false })
  @IsOptional()
  phone: string;

  @ApiProperty({ description: '用户的登陆密码', required: false })
  @IsOptional()
  password: string;
}
