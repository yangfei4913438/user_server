import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class RabbitMQService {
  constructor(private readonly amqp: AmqpConnection) {}

  async publish<T>(exchange: string, routingKey: string, message: T) {
    await this.amqp.publish<T>(exchange, routingKey, message);
  }
}
