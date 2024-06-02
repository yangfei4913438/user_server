import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import {
  Permission,
  PermissionDto,
  PermissionUpdateDto,
} from './dto/permission.dto';
import { mq } from '../consts/user';
import { handleDatabaseError } from '../utils/prisma.error';

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly rabbitmq: RabbitMQService,
  ) {}

  // 缓存时间 1 小时
  private cacheTTL = 60 * 60;

  async create(user_id: string, data: PermissionDto): Promise<Permission> {
    this.logger.log(`user_id:${user_id}, data: ${JSON.stringify(data)}`);
    try {
      // 保存到数据库
      const permission = (await this.prisma.permission.create({
        data: {
          name: data.name,
          description: data.description,
          type: data.type,
        },
      })) as Permission;
      // 更新缓存
      await this.redis.setHash(
        `permission:${permission.id}`,
        permission,
        this.cacheTTL,
      );
      // 查看内存列表有没有
      const list = await this.redis.hash_list_get('permissions');
      if (list.length === 0) {
        await this.redis.hash_list_push(
          'permissions',
          [permission],
          this.cacheTTL,
        );
      } else {
        await this.redis.hash_list_append(
          'permissions',
          permission.id,
          permission,
        );
      }
      // 提交给消息队列
      await this.rabbitmq.publish(
        mq.exchange.name,
        mq.routers.permission.create.name,
        { user_id, name: permission.name, createdAt: permission.createdAt },
      );
      // 返回数据给客户端
      return permission;
    } catch (error) {
      console.log(error);
      handleDatabaseError(error, '创建权限失败');
    }
  }

  async getPermissions(): Promise<Permission[]> {
    try {
      // 查看内存有没有
      const list = await this.redis.hash_list_get('permissions');
      if (list.length > 0) {
        return list;
      }
      // 没有就从数据库查询
      const arr = (await this.prisma.permission.findMany()) as Permission[];
      if (arr.length === 0) {
        // 没有就返回空，空值不缓存
        return [];
      }
      // 写入内存
      await this.redis.hash_list_push('permissions', arr, this.cacheTTL);
      // 返回数据
      return arr;
    } catch (error) {
      console.log(error);
      handleDatabaseError(error, '查询权限列表失败');
    }
  }

  async getPermissionById(id: string): Promise<Permission> {
    try {
      // 从缓存获取信息
      const permission = this.redis.getHash(`permission:${id}`);
      if (permission && Object.keys(permission).length > 0) {
        return this.fromHash(permission);
      }
      // 没有，从数据库获取
      const data = id
        ? ((await this.prisma.permission.findFirst({
            where: { id },
          })) as Permission)
        : null;
      if (!data) {
        return null;
      }
      // 存入缓存
      await this.redis.setHash(
        `permission:${id}`,
        this.toHash(data),
        this.cacheTTL,
      );
      return data;
    } catch (error) {
      console.log(error);
      handleDatabaseError(error, '查询权限失败');
    }
  }

  async update(
    user_id: string,
    data: PermissionUpdateDto,
  ): Promise<Permission> {
    // 先查看是否存在
    const result = await this.getPermissionById(data.id);
    if (!result) {
      throw new HttpException('不存在的权限', HttpStatus.NOT_FOUND);
    }

    try {
      // 更新操作
      const permission = (await this.prisma.permission.update({
        where: { id: result.id },
        data,
      })) as Permission;
      // 更新缓存
      await this.redis.setHash(
        `permission:${data.id}`,
        this.toHash(permission),
        this.cacheTTL,
      );
      // 更新列表缓存
      const list = await this.redis.hash_list_get('permissions');
      if (list.length === 0) {
        await this.redis.hash_list_push(
          'permissions',
          [permission],
          this.cacheTTL,
        );
      } else {
        await this.redis.hash_list_update_by_id(
          'permissions',
          permission.id,
          permission,
        );
      }
      // 消息队列
      await this.rabbitmq.publish(
        mq.exchange.name,
        mq.routers.permission.update.name,
        { user_id, name: permission.name, updatedAt: permission.updatedAt },
      );
      // 返回数据
      return permission;
    } catch (error) {
      console.log(error);
      handleDatabaseError(error, '更新权限失败');
    }
  }

  async delete(user_id: string, id: string): Promise<Permission> {
    // 先查看是否存在
    const result = await this.getPermissionById(id);
    if (!result) {
      throw new HttpException('不存在的权限', HttpStatus.NOT_FOUND);
    }
    this.logger.log(`result: ${JSON.stringify(result)}`);
    try {
      // 删除数据库的数据
      await this.prisma.permission.delete({
        where: { id },
      });
      // 清理列表中的权限缓存
      await this.redis.hash_list_del_by_id('permissions', id);
      // 删除缓存
      await this.redis.del(`permission:${id}`);
      // 消息队列处理
      await this.rabbitmq.publish(
        mq.exchange.name,
        mq.routers.permission.delete.name,
        { user_id, name: result.name },
      );
      // 返回被删除的数据
      return result;
    } catch (error) {
      console.log(error);
      handleDatabaseError(error, '删除权限失败');
    }
  }

  private fromHash(permission: Record<string, any>): Permission {
    return {
      id: permission.id,
      name: permission.name,
      description: permission.description,
      type: permission.type,
      createdAt: new Date(permission.createdAt),
      updatedAt: new Date(permission.updatedAt),
    };
  }
  private toHash(permission: Permission): Record<string, string> {
    return {
      id: permission.id,
      name: permission.name,
      description: permission.description,
      type: permission.type,
      createdAt: permission.createdAt.toISOString(),
      updatedAt: permission.updatedAt.toISOString(),
    };
  }
}
