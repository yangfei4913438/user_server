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
} as const;
