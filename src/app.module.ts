import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { RedisModule } from './redis/redis.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpGuard } from './http.guard';
import { HttpTransformInterceptor } from './http.transform.interceptor';
import { HttpExceptionFilter } from './http.exception.filter';
import { TaskModule } from './task/task.module';
import { PermissionModule } from './permission/permission.module';
import { RoleModule } from './role/role.module';

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
    TaskModule,
    PermissionModule,
    RoleModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: HttpGuard }, // 全局守卫
    { provide: APP_INTERCEPTOR, useClass: HttpTransformInterceptor }, // 全局拦截器
    { provide: APP_FILTER, useClass: HttpExceptionFilter }, // 全局过滤器
  ],
})
export class AppModule {}
