import { Injectable } from '@nestjs/common';
import {
  AmqpConnection,
  MessageHandlerOptions,
  SubscriberHandler,
} from '@golevelup/nestjs-rabbitmq';
import { EmailService } from '../email/email.service';

@Injectable()
export class RabbitMQService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async publish(exchange: string, routingKey: string, message: any) {
    await this.amqpConnection.publish(exchange, routingKey, message);
  }

  async subscribe<T>(
    handler: SubscriberHandler<T>,
    queue: string,
    msgOptions: MessageHandlerOptions,
    consumeOptions?: any,
  ) {
    await this.amqpConnection.createSubscriber(
      handler,
      msgOptions,
      queue,
      consumeOptions,
    );
  }
}
