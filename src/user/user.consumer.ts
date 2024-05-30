import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { PrismaService } from '../prisma/prisma.service';
import { mq } from '../consts/user';
import { EmailService } from '../email/email.service';
import { User } from '@prisma/client';

@Injectable()
export class UserConsumer {
  private readonly logger = new Logger(UserConsumer.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  @RabbitSubscribe({
    exchange: mq.exchange.name,
    routingKey: mq.routers.user.create.name,
    queue: mq.routers.user.create.queue,
  })
  async handleUserCreated(user: User & { row_password: string }) {
    const { row_password, password, ...rest } = user;

    // 发送通知邮件
    await this.emailService
      .sendMail({
        to: user.email,
        subject: '注册成功',
        html: `<div>
        <p><strong>恭喜您注册成功!</strong></p>
        <p>您的登陆用户名为 ${user.username}</p>
        <p>你的登陆邮箱为 ${user.email}</p>
        <p>您的登录密码为 ${user.row_password}</p>
        <p>请注意保管好您的账号信息</p>
      </div>`,
      })
      .then(() => {
        this.logger.log('创建用户: 邮件通知发送成功！');
      })
      .catch((err) => {
        this.logger.error(`创建用户: 邮件通知发送出错 ${err}`);
      });

    // 记录审计日志
    await this.prisma.auditLog
      .create({
        data: {
          action: mq.routers.user.create.name,
          result: `创建成功！用户id: ${rest.id}, 创建时间: ${new Date(rest.createdAt).toISOString()}`,
          userId: user.id,
        },
      })
      .then(() => {
        this.logger.log('创建用户: 审计日志记录成功');
      })
      .catch((err) => {
        this.logger.error(`创建用户: 审计日志记录出错 ${err}`);
      });
  }

  @RabbitSubscribe({
    exchange: mq.exchange.name,
    routingKey: mq.routers.user.update.name,
    queue: mq.routers.user.update.queue,
  })
  async handleUserUpdated(message: any) {
    // 发送通知邮件
    // todo

    // 记录审计日志
    await this.prisma.auditLog.create({
      data: {
        action: mq.routers.user.update.name,
        result: JSON.stringify(message),
        userId: message.id,
      },
    });
    console.log(`User updated: ${JSON.stringify(message)}`);
  }

  @RabbitSubscribe({
    exchange: mq.exchange.name,
    routingKey: mq.routers.user.delete.name,
    queue: mq.routers.user.delete.queue,
  })
  async handleUserDeleted(message: any) {
    // 发送通知邮件
    // todo

    // 处理用户删除消息
    await this.prisma.auditLog.create({
      data: {
        action: mq.routers.user.delete.name,
        result: JSON.stringify(message),
        userId: message.id,
      },
    });
    console.log(`User deleted: ${JSON.stringify(message)}`);
  }
}
