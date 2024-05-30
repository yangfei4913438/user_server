import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class HttpTransformInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpTransformInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      // 只处理网络请求相关的拦截, 直接放行
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        // 就是把返回数据的外面，包裹一层数据，不需要每个返回都加上相同的数据。
        return {
          errno: 0,
          data,
        };
      }),
    );
  }
}
