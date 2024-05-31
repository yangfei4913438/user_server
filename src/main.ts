import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api'); // 全局路由前缀

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 移除未在 DTO 中定义的属性
      forbidNonWhitelisted: false, // 当请求中包含未定义的属性时, 不会抛出错误
      transform: true, // 自动转换 DTO 中的类型
    }),
  ); // 全局参数校验

  app.enableCors(); // 允许跨域

  // 构建配置
  const swaggerConfig = new DocumentBuilder()
    .setTitle('用户管理系统 - Swagger API')
    .setDescription('一个典型的后台用户管理系统')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      description: '基于 JWT 的认证',
      name: 'bearer',
    })
    .build();
  // 创建文档
  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    ignoreGlobalPrefix: false,
    deepScanRoutes: true,
  });
  // 模块注册，指定路由
  SwaggerModule.setup('/', app, document);

  await app.listen(3000); // 启动监听端口
}

bootstrap();
