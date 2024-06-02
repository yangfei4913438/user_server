import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { mq } from '../consts/user';

@Injectable()
export class PermissionConsumer {
  private readonly logger = new Logger(PermissionConsumer.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  @RabbitSubscribe({
    exchange: mq.exchange.name,
    routingKey: mq.routers.permission.create.name,
    queue: mq.routers.permission.create.queue,
  })
  async handleCreated(data: {
    user_id: string;
    name: string;
    createdAt: Date;
  }) {
    // 权限操作属于普通操作，不属于敏感操作，只要记录审计日志即可。
    await this.prisma.auditLog
      .create({
        data: {
          action: mq.routers.permission.create.name,
          result: `权限 ${data.name} 创建成功! 创建时间: ${new Date(data.createdAt).toISOString()}`,
          userId: data.user_id,
        },
      })
      .then(() => {
        this.logger.log('创建权限: 审计日志记录成功');
      })
      .catch((err) => {
        this.logger.error(`创建权限: 审计日志记录出错 ${err}`);
      });
  }

  @RabbitSubscribe({
    exchange: mq.exchange.name,
    routingKey: mq.routers.permission.update.name,
    queue: mq.routers.permission.update.queue,
  })
  async handleUpdated(data: {
    user_id: string;
    name: string;
    updatedAt: Date;
  }) {
    // 权限操作属于普通操作，不属于敏感操作，只要记录审计日志即可。
    await this.prisma.auditLog
      .create({
        data: {
          action: mq.routers.permission.update.name,
          result: `权限 ${data.name} 更新成功！更新时间: ${new Date(data.updatedAt).toISOString()}`,
          userId: data.user_id,
        },
      })
      .then(() => {
        this.logger.log('更新权限: 审计日志记录成功');
      })
      .catch((err) => {
        this.logger.error(`更新权限: 审计日志记录出错 ${err}`);
      });
  }

  @RabbitSubscribe({
    exchange: mq.exchange.name,
    routingKey: mq.routers.permission.delete.name,
    queue: mq.routers.permission.delete.queue,
  })
  async handleDeleted(data: { user_id: string; name: string }) {
    // 权限操作属于普通操作，不属于敏感操作，只要记录审计日志即可。
    await this.prisma.auditLog
      .create({
        data: {
          action: mq.routers.permission.delete.name,
          result: `权限 ${data.name} 删除成功！ 更新时间: ${new Date().toISOString()}`,
          userId: data.user_id,
        },
      })
      .then(() => {
        this.logger.log('删除权限: 审计日志记录成功');
      })
      .catch((err) => {
        this.logger.error(`删除权限: 审计日志记录出错 ${err}`);
      });
  }
}
