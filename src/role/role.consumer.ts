import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { mq } from '../consts/user';

@Injectable()
export class RoleConsumer {
  private readonly logger = new Logger(RoleConsumer.name);

  constructor(private readonly prisma: PrismaService) {}

  @RabbitSubscribe({
    exchange: mq.exchange.name,
    routingKey: mq.routers.role.create.name,
    queue: mq.routers.role.create.queue,
  })
  async create(data: { user_id: string; name: string; createdAt: Date }) {
    // 权限操作属于普通操作，不属于敏感操作，只要记录审计日志即可。
    await this.prisma.auditLog
      .create({
        data: {
          action: mq.routers.role.create.name,
          result: `角色 ${data.name} 创建成功! 创建时间: ${new Date(data.createdAt).toISOString()}`,
          userId: data.user_id,
        },
      })
      .then(() => {
        this.logger.log('创建角色: 审计日志记录成功');
      })
      .catch((err) => {
        this.logger.error(`创建角色: 审计日志记录出错 ${err}`);
      });
  }

  @RabbitSubscribe({
    exchange: mq.exchange.name,
    routingKey: mq.routers.role.update.name,
    queue: mq.routers.role.update.queue,
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
          action: mq.routers.role.update.name,
          result: `角色 ${data.name} 更新成功！更新时间: ${new Date(data.updatedAt).toISOString()}`,
          userId: data.user_id,
        },
      })
      .then(() => {
        this.logger.log('更新角色: 审计日志记录成功');
      })
      .catch((err) => {
        this.logger.error(`更新角色: 审计日志记录出错 ${err}`);
      });
  }

  @RabbitSubscribe({
    exchange: mq.exchange.name,
    routingKey: mq.routers.role.delete.name,
    queue: mq.routers.role.delete.queue,
  })
  async handleDeleted(data: { user_id: string; name: string }) {
    // 权限操作属于普通操作，不属于敏感操作，只要记录审计日志即可。
    await this.prisma.auditLog
      .create({
        data: {
          action: mq.routers.role.delete.name,
          result: `角色 ${data.name} 删除成功！ 更新时间: ${new Date().toISOString()}`,
          userId: data.user_id,
        },
      })
      .then(() => {
        this.logger.log('删除角色: 审计日志记录成功');
      })
      .catch((err) => {
        this.logger.error(`删除角色: 审计日志记录出错 ${err}`);
      });
  }
}
