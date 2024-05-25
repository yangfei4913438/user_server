import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 这段代码使用 Reflector 来获取自定义元数据 IS_PUBLIC_KEY，这通常用来标记某个路由处理程序（handler）或类（class）是否公开，
    // 即无需认证即可访问。代码中的 getAllAndOverride 方法尝试从路由处理程序或类中获取 IS_PUBLIC_KEY 元数据值。
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      // 如果 IS_PUBLIC_KEY 的值为真，就不需要校验了，直接放行。
      return true;
    }

    // 获取 request
    const request = context.switchToHttp().getRequest();
    // 获取 token
    const token = this.extractTokenFromHandler(request);
    if (!token) {
      throw new HttpException('无效的请求', HttpStatus.FORBIDDEN);
    }
    try {
      // 解密，拿到用户ID.
      // 将用户ID，添加到请求上下文中
      request['user_id'] = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
    } catch (err) {
      // token 异常才会解密失败
      console.error('token解密失败:', err);
      throw new HttpException('token 无效', HttpStatus.FORBIDDEN);
    }
    // 没有问题，就返回 true
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
