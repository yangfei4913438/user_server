import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpTransformInterceptor } from './http.transform.interceptor';
import { HttpExceptionFilter } from './http.exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api'); // 全局路由前缀

  app.useGlobalPipes(new ValidationPipe()); // 全局参数校验

  app.enableCors(); // 允许跨域

  app.useGlobalInterceptors(new HttpTransformInterceptor()); // 全局返回转换拦截器

  app.useGlobalFilters(new HttpExceptionFilter()); // 全局异常过滤器

  await app.listen(3000); // 启动监听端口
}
bootstrap();
