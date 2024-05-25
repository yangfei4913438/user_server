import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class HttpTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
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
