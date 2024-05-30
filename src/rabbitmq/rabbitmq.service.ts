import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  AmqpConnection,
  MessageHandlerOptions,
  SubscriberHandler,
} from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class RabbitMQService implements OnModuleInit {
  constructor(private readonly amqp: AmqpConnection) {}

  async onModuleInit(): Promise<void> {
    // 这里不需要显示的处理连接，模块初始化的时候，会自动处理连接。
    // 这里可以添加一些自定义操作。
    // console.log('初始化连接mq');
  }

  async publish<T>(exchange: string, routingKey: string, message: T) {
    await this.amqp.publish<T>(exchange, routingKey, message);
  }

  async subscribe<T>(
    handler: SubscriberHandler<T>,
    queue: string,
    msgOptions: MessageHandlerOptions,
    consumeOptions?: any,
  ) {
    await this.amqp.createSubscriber<T>(
      handler,
      msgOptions,
      queue,
      consumeOptions,
    );
  }
}
