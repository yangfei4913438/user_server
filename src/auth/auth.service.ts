import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { AuthLoginDto, AuthRegisterDto } from './dto/auth.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { mq, token } from '../consts/user';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { formatHash, verifyHash } from '../utils/format';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly rabbitmq: RabbitMQService,
  ) {}

  // 登录
  async login(user: AuthLoginDto) {
    if (!user.username && !user.email) {
      throw new HttpException('缺少登陆账号', HttpStatus.FORBIDDEN);
    }
    if (!user.password && !user.code) {
      throw new HttpException('缺少登陆密码或验证码', HttpStatus.FORBIDDEN);
    }

    // 基础信息
    let where = null;
    if (user.username) {
      where = { username: user.username };
    } else if (user.email) {
      where = { email: user.email };
    } else if (user.email && user.username) {
      where = { email: user.email, username: user.username };
    }

    // 从数据库中获取用户信息
    const userInfo = await this.prisma.user.findUnique({
      where,
    });
    // 判断是否存在这个用户
    if (!userInfo) {
      this.logger.log('用户登陆：不存在的账号');
      throw new HttpException('无效的账号或密码', HttpStatus.FORBIDDEN);
    }

    // 判断验证码是否存在
    if (user.code) {
      // 验证邮件是否存在
      if (!user.email) {
        this.logger.log(
          '用户登陆：无效的参数组合，提供了验证码没有提供邮件地址！',
        );
        throw new HttpException('无效的登陆参数！', HttpStatus.FORBIDDEN);
      }
      // 验证验证码是否匹配
      const code = await this.redis.get(user.email);
      if (user.code !== code) {
        this.logger.log('用户登陆：验证码不匹配');
        throw new HttpException('无效的验证码', HttpStatus.FORBIDDEN);
      } else {
        // 验证通过后，删除验证码
        await this.redis.del(user.email);
      }
    }
    // 判断密码是否存在, 密码和验证码，只会同时存在一个。
    else if (user.password) {
      const passOk = await verifyHash(userInfo.password, user.password);
      if (!passOk) {
        this.logger.log('用户登陆：密码不匹配');
        throw new HttpException('无效的账号或密码', HttpStatus.FORBIDDEN);
      }
    }

    // 验证通过
    // 判断用户是否为注销状态
    if (userInfo.deletedAt) {
      // 移除注销状态
      await this.prisma.user.update({
        where: { id: userInfo.id },
        data: { deletedAt: null },
      });
      // 消息队列，注销流程取消通知，审计日志记录
      await this.rabbitmq.publish(
        mq.exchange.name,
        mq.routers.user.uncanceled.name,
        {
          email: userInfo.email,
          id: userInfo.id,
          updatedAt: userInfo.updatedAt,
        },
      );
    }

    // 密码字段，不返回给用户
    delete userInfo.password;
    // 获取token
    const tokens = await this.getTokens(userInfo.id);
    // 返回数据
    return {
      // 访问token，用来鉴权
      access_token: tokens.access_token,
      // 当访问token过期后，使用刷新token来更新访问token
      refresh_token: tokens.refresh_token,
      userInfo,
    };
  }

  private async getTokens(id: string) {
    // 生成访问token
    const access_token = this.jwtService.sign(
      { id }, // 只存储用户id
      { expiresIn: token.expiresIn.access, secret: process.env.JWT_SECRET }, // 4小时过期
    );
    // 生成刷新token
    const refresh_token = this.jwtService.sign(
      { id }, // 只存储用户id
      { expiresIn: token.expiresIn.refresh, secret: process.env.JWT_SECRET }, // 7天过期
    );
    // 存储登陆信息，白名单，查不到的禁止登陆
    await this.redis.set(
      token.redis_whitelist_key(id),
      access_token,
      token.expires.access,
    );
    // 刷新token白名单
    await this.redis.set(
      token.redis_whitelist_key_refresh(id),
      refresh_token,
      token.expires.refresh,
    );
    return {
      access_token,
      refresh_token,
    };
  }

  // 刷新token
  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new HttpException('无效的刷新token', HttpStatus.FORBIDDEN);
    }
    // 定义一个局部变量
    let user_id = '';
    try {
      // 获取token数据
      const data = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET,
      });
      // 拿到用户ID
      user_id = data['id'];
    } catch (error) {
      // token 异常才会解密失败
      console.error('刷新token解密失败:', error);
      throw new UnauthorizedException('刷新token已经过期, 请重新登陆');
    }

    // 确认是否在白名单中
    const exist_token = await this.redis.get(
      token.redis_whitelist_key_refresh(user_id),
    );
    if (!exist_token) {
      throw new UnauthorizedException('刷新token已经过期, 请重新登陆');
    }
    if (exist_token !== refreshToken) {
      throw new UnauthorizedException('该用户已在其他设备上登陆，请重新登陆');
    }

    // 返回新token
    return await this.getTokens(user_id);
  }

  // 注册
  async register(user: AuthRegisterDto): Promise<any> {
    const hashedPassword = await formatHash(user.password);
    return this.userService.createUser(
      {
        ...user,
        password: hashedPassword,
      },
      user.password,
    );
  }
}
