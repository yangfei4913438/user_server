import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api'); // 全局路由前缀

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 移除未在 DTO 中定义的属性
      forbidNonWhitelisted: true, // 抛出错误，当请求中包含未定义的属性时
      transform: true, // 自动转换 DTO 中的类型
      validationError: { target: false, value: false }, // 可选项，用于配置错误消息格式
    }),
  ); // 全局参数校验

  app.enableCors(); // 允许跨域

  await app.listen(3000); // 启动监听端口
}

bootstrap();
