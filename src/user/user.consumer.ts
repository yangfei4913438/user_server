import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { PrismaService } from '../prisma/prisma.service';
import { mq } from '../consts/user';
import { EmailService } from '../email/email.service';
import { User } from '@prisma/client';
import { UpdateUserDto } from './dto/user.dto';

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
  async handleUserUpdated(
    data: UpdateUserDto & { email: string; id: string; updatedAt: Date },
  ) {
    const { id, email, updatedAt, ...rest } = data;
    // 发送通知邮件
    await this.emailService
      .sendMail({
        to: email,
        subject: '更新成功',
        html: `<div>
        <p><strong>您的用户信息已经修改成功!</strong></p>
        <p>本次修改内容为: ${JSON.stringify(rest)}</p>
        <p>如果不是您本人操作，请尽快联系我们处理！</p>
      </div>`,
      })
      .then(() => {
        this.logger.log('更新用户: 邮件通知发送成功！');
      })
      .catch((err) => {
        this.logger.error(`更新用户: 邮件通知发送出错 ${err}`);
      });

    // 记录审计日志
    await this.prisma.auditLog
      .create({
        data: {
          action: mq.routers.user.update.name,
          result: `更新成功！用户id: ${id}, 更新时间: ${new Date(updatedAt).toISOString()}`,
          userId: id,
        },
      })
      .then(() => {
        this.logger.log('更新用户: 审计日志记录成功');
      })
      .catch((err) => {
        this.logger.error(`更新用户: 审计日志记录出错 ${err}`);
      });
  }

  @RabbitSubscribe({
    exchange: mq.exchange.name,
    routingKey: mq.routers.user.cancel.name,
    queue: mq.routers.user.cancel.queue,
  })
  async handleUserCancel(data: { email: string; id: string; deletedAt: Date }) {
    const { id, email, deletedAt } = data;

    // 发送通知邮件
    await this.emailService
      .sendMail({
        to: email,
        subject: '注销成功',
        html: `<div>
        <p><strong>您的账号已经被注销!</strong>30天内登陆，可以恢复此账号，超过30天后登陆，需要重新注册。</p>
        <p>如果不是您本人操作，请尽快联系我们处理！</p>
      </div>`,
      })
      .then(() => {
        this.logger.log('注销用户: 邮件通知发送成功！');
      })
      .catch((err) => {
        this.logger.error(`注销用户: 邮件通知发送出错 ${err}`);
      });

    // 处理用户删除消息
    await this.prisma.auditLog.create({
      data: {
        action: mq.routers.user.cancel.name,
        result: `注销成功！用户id: ${id}, 注销时间: ${new Date(deletedAt).toISOString()}`,
        userId: id,
      },
    });
  }

  @RabbitSubscribe({
    exchange: mq.exchange.name,
    routingKey: mq.routers.user.uncanceled.name,
    queue: mq.routers.user.uncanceled.queue,
  })
  async handleUserUnCanceled(data: {
    email: string;
    id: string;
    updatedAt: Date;
  }) {
    const { id, email, updatedAt } = data;

    // 发送通知邮件
    await this.emailService
      .sendMail({
        to: email,
        subject: '取消注销成功',
        html: `<div>
        <p><strong>您的账号已经取消了注销流程!</strong>现在可以正常使用账号了。</p>
        <p>如果不是您本人操作，请尽快联系我们处理！</p>
      </div>`,
      })
      .then(() => {
        this.logger.log('取消注销用户: 邮件通知发送成功！');
      })
      .catch((err) => {
        this.logger.error(`取消注销用户: 邮件通知发送出错 ${err}`);
      });

    // 处理用户删除消息
    await this.prisma.auditLog.create({
      data: {
        action: mq.routers.user.cancel.name,
        result: `取消注销成功！用户id: ${id}, 取消注销时间: ${new Date(updatedAt).toISOString()}`,
        userId: id,
      },
    });
  }

  @RabbitSubscribe({
    exchange: mq.exchange.name,
    routingKey: mq.routers.user.delete.name,
    queue: mq.routers.user.delete.queue,
  })
  async handleUserDeleted(data: { email: string; id: string }) {
    const { id, email } = data;

    // 发送通知邮件
    await this.emailService
      .sendMail({
        to: email,
        subject: '删除成功',
        html: `<div>
        <p>由于注销后的30天内，您没有重新登陆账号，现在您的账号已经被系统自动删除!</p>
        <p>如需再次使用，请重新注册。</p>
      </div>`,
      })
      .then(() => {
        this.logger.log('删除用户: 邮件通知发送成功！');
      })
      .catch((err) => {
        this.logger.error(`删除用户: 邮件通知发送出错 ${err}`);
      });

    // 处理用户删除消息
    await this.prisma.auditLog.create({
      data: {
        action: mq.routers.user.delete.name,
        result: `删除成功！用户id: ${id}, 删除时间: ${new Date().toISOString()}`,
        userId: id,
      },
    });
  }
}
