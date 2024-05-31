import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';
import { RedisService } from './redis/redis.service';

@Injectable()
export class HttpGuard implements CanActivate {
  private readonly logger = new Logger(HttpGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext) {
    if (context.getType() !== 'http') {
      // 如果不是 HTTP 请求，则不执行守卫逻辑
      return true;
    }

    // 获取 request
    const request = context.switchToHttp().getRequest();

    if (!request) {
      this.logger.warn('Request is undefined');
      return false;
    }

    if (!request.method) {
      this.logger.warn('Request method is undefined');
      return false;
    }

    this.logger.log(`Request method: ${request.method}`);

    // 这段代码使用 Reflector 来获取自定义元数据 IS_PUBLIC_KEY，这通常用来标记某个路由处理程序（handler）或类（class）是否公开，
    // 即无需认证即可访问。代码中的 getAllAndOverride 方法尝试从路由处理程序或类中获取 IS_PUBLIC_KEY 元数据值。
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    this.logger.log(`isPublic: ${isPublic}`);

    if (request.method === 'OPTIONS') {
      return true;
    }

    if (isPublic) {
      // 如果 IS_PUBLIC_KEY 的值为真，就不需要校验了，直接放行。
      return true;
    }

    // 获取 token
    const token = this.extractTokenFromHandler(request);
    if (!token) {
      throw new UnauthorizedException('没有请求权限');
    }
    try {
      // 解密，拿到用户ID.
      // 将用户ID，添加到请求上下文中
      const data = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      // 将用户id写入请求上下文
      request['user_id'] = data['id'];
    } catch (err) {
      // token 异常才会解密失败
      console.error('token解密失败:', err);
      throw new UnauthorizedException('token已经过期, 请重新登陆');
    }

    // 判断是否在白名单中
    const exist_token = await this.redis.get(
      `access_token:${request['user_id']}`,
    );
    // 白名单没记录，一般来说不存在，登陆和刷新token都会进行更新。
    // 遇到了，当成过期处理，让用户重新登陆即可。
    if (!exist_token) {
      throw new UnauthorizedException('token已经过期, 请重新登陆');
    }
    // token 没过期，但是和白名单的值不一样，表示重新登陆过了，或者token被刷新了但请求上旧的。
    // 这种一般就是在其他设备登陆了。
    if (exist_token !== token) {
      throw new UnauthorizedException('该用户已在其他设备上登陆，请重新登陆');
    }

    return true;
  }

  // 从请求头里面，取出客户端发来的token
  private extractTokenFromHandler(request: Request): string | undefined {
    // 提取字符串
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    // 判断 token 类型
    return type === 'Bearer' ? token : undefined;
  }
}
