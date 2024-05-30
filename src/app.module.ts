import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { RedisModule } from './redis/redis.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppGuard } from './app.guard';
import { HttpTransformInterceptor } from './http.transform.interceptor';
import { HttpExceptionFilter } from './http.exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    RabbitmqModule,
    RedisModule,
    PrismaModule,
    UserModule,
    AuthModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: AppGuard }, // 全局守卫
    { provide: APP_INTERCEPTOR, useClass: HttpTransformInterceptor }, // 全局拦截器
    { provide: APP_FILTER, useClass: HttpExceptionFilter }, // 全局过滤器
  ],
})
export class AppModule {}
