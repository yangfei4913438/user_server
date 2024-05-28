export const mq = {
  // 环境变量：RABBITMQ_URI
  uri_env: process.env.RABBITMQ_URI,
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
      create: {
        name: 'user.created',
        queue: 'user_created_queue',
      },
      update: {
        name: 'user.updated',
        queue: 'user_updated_queue',
      },
      delete: {
        name: 'user.deleted',
        queue: 'user_deleted_queue',
      },
    },
  },
} as const; // 声明为const, 便于 ide 的注释提示
