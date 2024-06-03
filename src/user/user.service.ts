import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import { RedisService } from '../redis/redis.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { mq } from '../consts/user';
import { handleDatabaseError } from '../utils/prisma.error';
import { UpdateUserDto, UserReturn } from './dto/user.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly rabbitmq: RabbitMQService,
  ) {}

  // 缓存时间 1 小时
  private cacheTTL = 60 * 60;

  async createUser(
    data: Prisma.UserCreateInput,
    row_password: string,
  ): Promise<UserReturn> {
    try {
      // 创建用户
      const user = await this.prisma.user.create({ data });
      // 缓存用户信息
      await this.redis.setHash(
        `user:${user.id}`,
        this.toHash(user),
        this.cacheTTL,
      );
      // 查看内存列表有没有
      const list = await this.redis.hash_list_get('users');
      if (list.length === 0) {
        await this.redis.hash_list_push('users', [user], this.cacheTTL);
      } else {
        await this.redis.hash_list_append('users', user.id, user);
      }
      // 消息队列，处理用户创建消息
      await this.rabbitmq.publish(
        mq.exchange.name,
        mq.routers.user.create.name,
        { ...user, row_password },
      );
      // 返回用户信息
      return this.fromHash(user);
    } catch (error) {
      console.log(error);
      handleDatabaseError(error, '创建用户失败');
    }
  }

  async findAllUsers(): Promise<UserReturn[]> {
    try {
      // 从缓存中获取用户列表
      const list = await this.redis.hash_list_get('users');
      if (list.length > 0) {
        return list.map((hash) => this.fromHash(hash));
      }
      // 缓存不存在，从数据库中获取
      const user_list: User[] = await this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
      });
      if (user_list.length === 0) {
        return [];
      }

      // 缓存用户信息
      await this.redis.hash_list_push(
        'users',
        user_list.map((user) => this.toHash(user)) as {
          id: string;
          [key: string]: any;
        }[],
        this.cacheTTL,
      );

      // 返回用户列表
      return user_list.map((user) => this.filterPassword(user));
    } catch (error) {
      handleDatabaseError(error, '获取用户列表失败');
    }
  }

  async findUserById(id: string): Promise<UserReturn> {
    if (!id) return null;
    try {
      // 从缓存获取信息
      const user_info = await this.redis.getHash(`user:${id}`);
      if (user_info) {
        return this.fromHash(user_info);
      }
      // 缓存不存在，从数据库中获取
      const data = await this.prisma.user.findUnique({ where: { id } });
      if (!data) {
        return null;
      }
      // 缓存用户信息
      await this.redis.setHash(`user:${id}`, this.toHash(data), this.cacheTTL);
      // 返回用户信息
      return this.filterPassword(data);
    } catch (error) {
      handleDatabaseError(error, '获取用户信息失败');
    }
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<UserReturn> {
    // 先看有没有用户
    const old_user = await this.findUserById(id);
    if (!old_user) {
      throw new HttpException('需要更新的用户不存在!', HttpStatus.NOT_FOUND);
    }

    try {
      // 更新用户信息
      const user = await this.prisma.user.update({
        where: { id },
        data,
      });
      // 缓存用户信息
      await this.redis.setHash(`user:${id}`, this.toHash(user), this.cacheTTL);
      // 更新列表缓存
      const list = await this.redis.hash_list_get('users');
      if (list.length === 0) {
        await this.redis.hash_list_push('users', [user], this.cacheTTL);
      } else {
        await this.redis.hash_list_update_by_id('users', user.id, user);
      }
      // 消息队列，处理用户更新消息
      await this.rabbitmq.publish(
        mq.exchange.name,
        mq.routers.user.update.name,
        { ...data, email: user.email, id: user.id, updatedAt: user.updatedAt },
      );
      // 返回用户信息
      return this.filterPassword(user);
    } catch (error) {
      handleDatabaseError(error, '更新用户信息失败');
    }
  }

  // 注销用户
  async cancelUser(id: string) {
    // 先看有没有用户
    const old_user = await this.findUserById(id);
    if (!old_user) {
      throw new HttpException('用户不存在!', HttpStatus.NOT_FOUND);
    }
    try {
      // 更新用户信息
      const user = await this.prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      // 更新列表缓存
      const list = await this.redis.hash_list_get('users');
      if (list.length === 0) {
        await this.redis.hash_list_push('users', [user], this.cacheTTL);
      } else {
        await this.redis.hash_list_update_by_id('users', user.id, user);
      }
      // 消息队列，处理用户更新消息
      await this.rabbitmq.publish(
        mq.exchange.name,
        mq.routers.user.cancel.name,
        { email: user.email, id: user.id, deletedAt: user.deletedAt },
      );
      // 返回用户信息
      return this.filterPassword(user);
    } catch (error) {
      handleDatabaseError(error, '注销用户信息失败');
    }
  }

  // 清理用户
  async deleteUser(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    try {
      // 先查询出要删掉的数据
      const oldData = await this.prisma.user.findMany({
        where: {
          deletedAt: {
            lt: thirtyDaysAgo,
            not: null,
          },
        },
        select: {
          id: true,
          email: true,
        },
      });
      // 删除注销超过30天的用户
      await this.prisma.user.deleteMany({
        where: {
          deletedAt: {
            lt: thirtyDaysAgo,
            not: null,
          },
        },
      });

      // 清理相关缓存
      for (const user of oldData) {
        // 清理列表中的用户缓存
        await this.redis.hash_list_del_by_id('users', user.id);
        // 清理单独的用户缓存
        await this.redis.del(`user:${user.id}`);
        // 消息队列，处理用户删除消息
        await this.rabbitmq.publish(
          mq.exchange.name,
          mq.routers.user.delete.name,
          {
            id: user.id,
            email: user.email,
          },
        );
      }
      return;
    } catch (error) {
      handleDatabaseError(error, '删除用户信息失败');
    }
  }

  // 数据库的数据，直接过滤
  private filterPassword(user: User): UserReturn {
    return {
      id: user.id,
      avatar: user.avatar || '',
      username: user.username,
      email: user.email,
      phone: user.phone || '',
      nickname: user.nickname,
      hometown: user.hometown || '',
      birthday: user.birthday,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    };
  }

  // 存入redis，转为字符串
  private toHash(user: User): Record<string, string> {
    return {
      id: user.id,
      avatar: user.avatar || '',
      username: user.username,
      email: user.email,
      phone: user.phone || '',
      nickname: user.nickname,
      hometown: user.hometown || '',
      birthday: user.birthday ? user.birthday.toISOString() : null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      deletedAt: user.deletedAt ? user.deletedAt.toISOString() : null,
    };
  }

  // 从字符串转回正常数据
  private fromHash(hash: Record<string, string> | User): UserReturn {
    return {
      id: hash.id,
      avatar: hash.avatar,
      username: hash.username,
      email: hash.email,
      phone: hash.phone,
      nickname: hash.nickname,
      hometown: hash.hometown,
      birthday: hash.birthday ? new Date(hash.birthday) : null,
      createdAt: new Date(hash.createdAt),
      updatedAt: new Date(hash.updatedAt),
      deletedAt: hash.deletedAt ? new Date(hash.deletedAt) : null,
    };
  }
}
