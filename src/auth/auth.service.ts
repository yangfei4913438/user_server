import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import argon2 from 'argon2';
import { AuthLoginDto, AuthRegisterDto } from './dto/auth.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  // 登录
  async login(user: AuthLoginDto) {
    // 密码处理
    const hashedPassword = await argon2.hash(user.password);

    // 基础信息
    let where = null;
    if (user.username) {
      where = { username: user.username, password: hashedPassword };
    } else if (user.email) {
      where = { email: user.email, password: hashedPassword };
    } else if (user.phone) {
      where = { phone: user.phone, password: hashedPassword };
    }

    // 从数据库中获取用户信息
    const userInfo = await this.prisma.user.findUnique({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        avatar: true,
        nickname: true,
        birthday: true,
        hometown: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    // 判断是否存在这个用户
    if (!userInfo) {
      return null;
    }

    return {
      // 使用 JwtService 生成一个 token, 返回给用户
      access_token: this.jwtService.sign({ id: userInfo.id }),
      userInfo,
    };
  }

  // 注册
  async register(user: AuthRegisterDto): Promise<any> {
    const hashedPassword = await argon2.hash(user.password);
    return this.userService.createUser({
      ...user,
      password: hashedPassword,
    });
  }
}
