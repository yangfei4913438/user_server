import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import { RedisService } from '../redis/redis.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { mq } from '../consts/user';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly rabbitmq: RabbitMQService,
  ) {}

  // 缓存时间 1 小时
  private cacheTTL = 60 * 60;

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    try {
      // 创建用户
      const user = await this.prisma.user.create({ data });
      // 缓存用户信息
      await this.redis.setHash(
        `user:${user.id}`,
        this.toHash(user),
        this.cacheTTL,
      );
      // 消息队列，处理用户创建消息
      await this.rabbitmq.publish(
        mq.exchange.name,
        mq.routers.user.create.name,
        user,
      );
      // 返回用户信息
      return user;
    } catch (error) {
      throw new HttpException('创建用户失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAllUsers(): Promise<User[]> {
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
      return user_list;
    } catch (error) {
      throw new HttpException(
        '获取用户列表失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findUserById(id: string): Promise<User | null> {
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
      return data;
    } catch (error) {
      throw new HttpException(
        '获取用户信息失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateUser(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    try {
      // 更新用户信息
      const user = await this.prisma.user.update({
        where: { id },
        data,
      });
      // 缓存用户信息
      await this.redis.setHash(`user:${id}`, this.toHash(user), this.cacheTTL);
      // 消息队列，处理用户更新消息
      await this.rabbitmq.publish(
        mq.exchange.name,
        mq.routers.user.update.name,
        user,
      );
      // 返回用户信息
      return user;
    } catch (error) {
      throw new HttpException(
        '更新用户信息失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteUser(id: string): Promise<User> {
    try {
      // 删除用户
      await this.prisma.user.delete({ where: { id } });
      // 删除缓存
      await this.redis.del(`user:${id}`);
      // 消息队列，处理用户删除消息
      await this.rabbitmq.publish(
        mq.exchange.name,
        mq.routers.user.delete.name,
        {
          id,
        },
      );
      // 返回用户信息
      return { id } as User;
    } catch (error) {
      throw new HttpException(
        '删除用户信息失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private toHash(user: User): Record<string, string> {
    return {
      id: user.id,
      avatar: user.avatar || '',
      username: user.username || '',
      email: user.email || '',
      phone: user.phone || '',
      password: user.password,
      nickname: user.nickname,
      hometown: user.hometown || '',
      birthday: user.birthday.toISOString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private fromHash(hash: Record<string, string>): User {
    return {
      id: hash.id,
      avatar: hash.avatar,
      username: hash.username,
      email: hash.email,
      phone: hash.phone,
      password: hash.password,
      nickname: hash.nickname,
      hometown: hash.hometown,
      birthday: new Date(hash.birthday),
      createdAt: new Date(hash.createdAt),
      updatedAt: new Date(hash.updatedAt),
    };
  }
}
