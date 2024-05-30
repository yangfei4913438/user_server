import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpExceptionBody,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

// 捕获异常
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (request) {
      this.logger.log(`Filter - Request method: ${request.method}`);
    } else {
      this.logger.warn('Filter - Request is undefined');
    }

    const { message } = exception.getResponse() as HttpExceptionBody;

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const msg =
      exception instanceof HttpException ? exception.message : '服务器错误';

    response.status(status).json({
      errno: -1, // 错误码
      message: Array.isArray(message) ? message.join(',') : message || msg, // 消息
      path: request.url, // 请求 url 地址
      timestamp: new Date().toISOString(), // 时间戳
    });
  }
}
