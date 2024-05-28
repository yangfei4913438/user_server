import { Global, Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RabbitMQService } from './rabbitmq.service';
import { mq } from '../consts/user';

@Global()
@Module({
  imports: [
    RabbitMQModule.forRoot(RabbitMQModule, {
      exchanges: [
        {
          name: mq.exchange.name,
          type: mq.exchange.type,
        },
      ],
      uri: mq.uri_env,
    }),
  ],
  providers: [RabbitMQService],
  exports: [RabbitMQService],
})
export class RabbitmqModule {}
