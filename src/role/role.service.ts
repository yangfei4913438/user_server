import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { Role, RoleDto, RoleUpdateDto } from './dto/role.dto';
import { handleDatabaseError } from '../utils/prisma.error';
import { mq } from '../consts/user';
import { PermissionService } from '../permission/permission.service';

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly rabbitmq: RabbitMQService,
    private readonly permission: PermissionService,
  ) {}

  // 缓存时间 1 小时
  private cacheTTL = 60 * 60;

  // 创建角色
  async create(user_id: string, data: RoleDto): Promise<Role> {
    try {
      // 保存到数据库
      const role = await this.prisma.role.create({
        data: {
          name: data.name,
          description: data.description,
          type: data.type,
        },
      });
      // 存缓存
      await this.redis.setHash(`role:${user_id}`, this.toHash(role));
      // 更新列表
      const list = await this.redis.hash_list_get('roles');
      if (list.length === 0) {
        await this.redis.hash_list_push('roles', [role], this.cacheTTL);
      } else {
        await this.redis.hash_list_append('roles', role.id, role);
      }
      // 消息队列
      await this.rabbitmq.publish(
        mq.exchange.name,
        mq.routers.role.create.name,
        { user_id, name: role.name, createdAt: role.createdAt },
      );
      return role;
    } catch (error) {
      console.log(error);
      handleDatabaseError(error, '创建角色失败');
    }
  }

  async getRoles(): Promise<Role[]> {
    const list = await this.redis.hash_list_get('roles');
    if (list.length > 0) {
      return list;
    }
    try {
      // 从数据库获取数据
      const arr = await this.prisma.role.findMany();
      if (arr.length === 0) {
        return [];
      }
      // 写入内存
      await this.redis.hash_list_push('roles', arr, this.cacheTTL);
      // 返回数据
      return arr;
    } catch (error) {
      console.log(error);
      handleDatabaseError(error, '获取角色列表失败');
    }
  }

  async getRoleById(id: string): Promise<Role> {
    if (!id) return null;

    const result = await this.redis.getHash(`role:${id}`);
    if (result && Object.keys(result).length > 0) {
      return this.fromHash(result);
    }
    try {
      const role = await this.prisma.role.findFirst({ where: { id } });
      if (!role) return null;
      // 存入数据库
      await this.redis.setHash(`role:${id}`, this.toHash(role), this.cacheTTL);
      // 返回数据
      return role;
    } catch (error) {
      console.log(error);
      handleDatabaseError(error, '获取角色详情失败');
    }
  }

  async update(user_id: string, data: RoleUpdateDto) {
    // 先查看是否存在
    const result = await this.getRoleById(data.id);
    if (!result) {
      throw new HttpException('不存在的角色', HttpStatus.NOT_FOUND);
    }

    try {
      const role = await this.prisma.role.update({
        where: { id: data.id },
        data,
      });
      // 更新缓存
      await this.redis.setHash(
        `role:${data.id}`,
        this.toHash(role),
        this.cacheTTL,
      );
      // 更新列表缓存
      const list = await this.redis.hash_list_get('roles');
      if (list.length === 0) {
        await this.redis.hash_list_push('roles', [role], this.cacheTTL);
      } else {
        await this.redis.hash_list_update_by_id('roles', role.id, role);
      }
      // 消息队列
      await this.rabbitmq.publish(
        mq.exchange.name,
        mq.routers.role.update.name,
        { user_id, name: role.name, updatedAt: role.updatedAt },
      );
      // 返回数据
      return role;
    } catch (error) {
      console.log(error);
      handleDatabaseError(error, '更新角色失败');
    }
  }

  async delete(user_id: string, id: string): Promise<Role> {
    // 先查看是否存在
    const result = await this.getRoleById(id);
    if (!result) {
      throw new HttpException('不存在的角色', HttpStatus.NOT_FOUND);
    }
    try {
      // 删除数据库的数据
      await this.prisma.role.delete({
        where: { id },
      });
      // 清理列表中的权限缓存
      await this.redis.hash_list_del_by_id('roles', id);
      // 删除缓存
      await this.redis.del(`role:${id}`);
      // 消息队列处理
      await this.rabbitmq.publish(
        mq.exchange.name,
        mq.routers.role.delete.name,
        { user_id, name: result.name },
      );
      // 返回被删除的数据
      return result;
    } catch (error) {
      console.log(error);
      handleDatabaseError(error, '删除角色失败');
    }
  }

  // 添加权限，把不存在的添加进去
  async addPermissions(
    user_id: string,
    role_id: string,
    permissionIds: string[],
  ) {
    for (const permissionId of permissionIds) {
      const res = await this.permission.getPermissionById(permissionId);
      if (!res) {
        throw new HttpException(
          '添加权限失败: 不存在的权限!',
          HttpStatus.NOT_FOUND,
        );
      }
    }

    try {
      // 查看是不是已经存在的角色
      const currentList = await this.prisma.rolePermission.findMany({
        where: {
          roleId: role_id,
        },
      });
      // 添加权限
      await this.prisma.rolePermission.createMany({
        data: permissionIds
          // 找出不重复的权限
          .filter((pid) => !currentList.some((cl) => cl.permissionId === pid))
          // 构建需要的数据
          .map((permissionId) => {
            return { roleId: role_id, permissionId };
          }),
      });
      // 通知消息队列
      await this.rabbitmq.publish(
        mq.exchange.name,
        mq.routers.role.addedPermissions.name,
        {
          user_id,
          role_id,
          permissionIds,
          createdAt: new Date(),
        },
      );
      return '添加完成';
    } catch (error) {
      console.log(error);
      handleDatabaseError(error, '添加权限失败');
    }
  }

  // 更新权限，把旧的删了，新的添加进去
  async updatePermissions(
    user_id: string,
    role_id: string,
    permissionIds: string[],
  ) {
    // 检查传入的id是否为有效权限id，避免不存在的权限id，导致数据库处理的时候异常。
    for (const permissionId of permissionIds) {
      const res = await this.permission.getPermissionById(permissionId);
      if (!res) {
        throw new HttpException(
          '添加权限失败: 不存在的权限!',
          HttpStatus.NOT_FOUND,
        );
      }
    }

    try {
      // 直接添加，因为是相关联的多个操作，所以要开启事务来处理
      await this.prisma.$transaction(async (prisma) => {
        // 删除旧的权限
        await prisma.rolePermission.deleteMany({
          where: {
            roleId: role_id,
          },
        });
        // 添加新的权限
        await prisma.rolePermission.createMany({
          data: permissionIds.map((permissionId) => {
            return { roleId: role_id, permissionId };
          }),
        });
      });

      // 通知消息队列
      await this.rabbitmq.publish(
        mq.exchange.name,
        mq.routers.role.updatedPermissions.name,
        {
          user_id,
          role_id,
          permissionIds,
          updatedAt: new Date(),
        },
      );

      return '更新权限完成';
    } catch (error) {
      console.log(error);
      handleDatabaseError(error, '添加权限失败');
    }
  }

  // 清理某个角色下面的所有权限
  async clearPermissions(user_id: string, role_id: string) {
    try {
      // 批量删除
      await this.prisma.rolePermission.deleteMany({
        where: {
          roleId: role_id,
        },
      });

      // 通知消息队列
      await this.rabbitmq.publish(
        mq.exchange.name,
        mq.routers.role.clearPermissions.name,
        {
          user_id,
          role_id,
          updatedAt: new Date(),
        },
      );

      return '清理权限完成';
    } catch (error) {
      console.log(error);
      handleDatabaseError(error, '清理权限失败');
    }
  }

  private toHash(role: Role): Record<string, any> {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      type: role.type,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    };
  }

  private fromHash(role: Record<string, any>): Role {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      type: role.type,
      createdAt: new Date(role.createdAt),
      updatedAt: new Date(role.updatedAt),
    };
  }
}
