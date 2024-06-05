export const mq = {
  // 交换机
  exchange: {
    // 交换机名称
    name: 'user_exchange',
    // 交换机类型，主题交换机。
    type: 'topic',
  },
  // 路由
  routers: {
    // 角色
    role: {
      // 创建角色
      create: {
        name: 'role.created',
        queue: 'role_created_queue',
      },
      // 更新角色
      update: {
        name: 'role.updated',
        queue: 'role_updated_queue',
      },
      // 删除角色
      delete: {
        name: 'role.deleted',
        queue: 'role_deleted_queue',
      },
      // 角色添加权限
      addedPermissions: {
        name: 'role.added_permissions',
        queue: 'role_added_permissions',
      },
      // 角色更新或清空权限
      updatedPermissions: {
        name: 'role.updated_permissions',
        queue: 'role_updated_permissions_queue',
      },
    },
    // 权限
    permission: {
      // 创建权限
      create: {
        name: 'permission.created',
        queue: 'permission_created_queue',
      },
      // 更新权限
      update: {
        name: 'permission.updated',
        queue: 'permission_updated_queue',
      },
      // 删除权限
      delete: {
        name: 'permission.deleted',
        queue: 'permission_deleted_queue',
      },
    },
    // 用户
    user: {
      // 创建用户
      create: {
        name: 'user.created',
        queue: 'user_created_queue',
      },
      // 更新用户
      update: {
        name: 'user.updated',
        queue: 'user_updated_queue',
      },
      // 注销用户
      cancel: {
        name: 'user.cancel',
        queue: 'user_cancel_queue',
      },
      // 取消注销
      uncanceled: {
        name: 'user.uncanceled',
        queue: 'user_uncanceled_queue',
      },
      // 删除用户
      delete: {
        name: 'user.deleted',
        queue: 'user_deleted_queue',
      },
      // 添加用户的角色
      addedRoles: {
        name: 'user.added_roles',
        queue: 'user_added_roles_queue',
      },
      // 更新或清空用户的角色
      updatedRoles: {
        name: 'user.updated_roles',
        queue: 'user_updated_roles_queue',
      },
    },
  },
} as const; // 声明为const, 便于 ide 的注释提示

export const token = {
  // 过期时间
  expiresIn: {
    // 12小时
    access: '12h',
    // 7天
    refresh: '7d',
  },
  // 过期时间，秒
  expires: {
    // 12 小时
    access: 60 * 60 * 12,
    // 7天
    refresh: 60 * 60 * 24 * 7,
  },
  // redis 中的白名单key
  redis_whitelist_key: (id: string) => `access_token:${id}`,
  // 刷新token
  redis_whitelist_key_refresh: (id: string) => `refresh_token:${id}`,
} as const;
