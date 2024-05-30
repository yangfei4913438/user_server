import { Global, Module } from '@nestjs/common';
import {
  MessageHandlerErrorBehavior,
  RabbitMQModule,
} from '@golevelup/nestjs-rabbitmq';
import { RabbitMQService } from './rabbitmq.service';
import { mq } from '../consts/user';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    RabbitMQModule.forRootAsync(RabbitMQModule, {
      useFactory: (configService: ConfigService) => ({
        exchanges: [
          {
            name: mq.exchange.name,
            type: mq.exchange.type,
            options: {
              durable: false, // 服务器重启后，是否持久化
            },
          },
        ],
        uri: configService.get<string>('RABBITMQ_URI'),
        enableDirectReplyTo: false, // 不使用匿名队列
        prefetchCount: 100, // 通道的预读取数量, 默认值
        defaultSubscribeErrorBehavior: MessageHandlerErrorBehavior.ACK, // 发生错误时，自动确认消息，并从队列中删除。避免反复传递和死信队列。
        connectionInitOptions: {
          wait: false, // 是否等待连接成功后，才开始启动应用程序
        },
        connectionManagerOptions: {
          heartbeatIntervalInSeconds: 60,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [RabbitMQService],
  exports: [RabbitMQService],
})
export class RabbitmqModule {}
