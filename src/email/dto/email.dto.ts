import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EmailDto {
  @ApiProperty({ description: '登陆的用户邮件地址' })
  @IsNotEmpty({ message: '邮件地址，不能为空' })
  @IsEmail({}, { message: '这不是一个有效的邮件地址' })
  email: string;
}
