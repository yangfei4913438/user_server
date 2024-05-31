import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis, { Redis as RedisType } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisType;

  async onModuleInit() {
    // ioredis 创建实例的时候，会自动连接，不需要显示的手动连接
    this.client = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT, 10),
      db: parseInt(process.env.REDIS_DB, 10),
    });
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  // 获取结构化数据
  async getHash(hashKey: string): Promise<Record<string, string> | null> {
    const obj = await this.client.hgetall(hashKey);
    if (Object.keys(obj).length === 0) {
      return null;
    }
    return Object.fromEntries(
      Object.entries(obj).map(([field, value]) => [field, JSON.parse(value)]),
    );
  }

  // 存储结构化数据
  async setHash(
    hashKey: string,
    value: Record<string, any>,
    ttl?: number,
  ): Promise<void> {
    // 创建一个包含序列化值的新对象
    const serializedObj = Object.fromEntries(
      Object.entries(value).map(([field, value]) => [
        field,
        JSON.stringify(value),
      ]),
    );
    // 使用 hSet 方法设置序列化后的对象字段
    await this.client.hset(hashKey, serializedObj);
    if (ttl) {
      await this.client.expire(hashKey, ttl);
    }
  }

  // 哈希数组: 获取数组的全部数据
  async hash_list_get(key: string) {
    const results = [];
    const fields = await this.client.hkeys(key);
    for (const field of fields) {
      const value = await this.client.hget(key, field);
      results.push(JSON.parse(value));
    }
    return results;
  }

  // 哈希数组: 按顺序放入一个数组并设置过期时间
  async hash_list_push(
    key: string,
    array: { id: string; [key: string]: any }[],
    ttl?: number,
  ) {
    for (const item of array) {
      await this.client.hset(key, item.id, JSON.stringify(item));
    }
    if (ttl) {
      await this.client.expire(key, ttl);
    }
  }

  // 追加一个元素到数组的尾部
  async hash_list_append(key: string, id: string, value: any) {
    await this.client.hset(key, id, JSON.stringify(value));
  }

  // 删除数组中指定 ID 的元素
  async hash_list_del_by_id(key: string, id: string) {
    await this.client.hdel(key, id);
  }

  // 更新数组中指定 ID 的元素
  async hash_list_update_by_id(key: string, id: string, value: any) {
    const json_data = await this.client.hget(key, id);
    const data = JSON.parse(json_data);
    const end = { ...data, ...value };
    await this.client.hset(key, id, JSON.stringify(end));
  }

  // 获取非结构化数据
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  // 存储非结构化数据
  async set(key: string, value: string, ttl?: number): Promise<void> {
    await this.client.set(key, value);
    if (ttl) {
      await this.client.expire(key, ttl);
    }
  }

  // 删除数据
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  // zset
  // 将datetime字符串转换为UNIX时间戳（以毫秒为单位）
  private convertDatetimeToTimestamp(datetime: string): number {
    const date = new Date(datetime);
    return date.getTime();
  }
  // 添加对象
  async addObjectToZSet(
    key: string,
    datetime: string,
    obj: any,
  ): Promise<void> {
    const score = this.convertDatetimeToTimestamp(datetime);
    const member = JSON.stringify(obj);
    await this.client.zadd(key, score.toString(), member);
  }
  // 获取对象列表，正序
  async getObjectFromZSetAsc(key: string): Promise<string[]> {
    // 正序排列
    return this.client.zrange(key, 0, -1);
  }
  // 获取对象列表，倒序
  async getObjectFromZSetDesc(key: string): Promise<string[]> {
    // 倒序
    return this.client.zrevrange(key, 0, -1);
  }

  // 更新对象
  async updateObjectInZSet(
    key: string,
    datetime: string,
    oldObj: any,
    newObj: any,
  ): Promise<void> {
    // 数据转换
    const oldMember = JSON.stringify(oldObj);
    const newMember = JSON.stringify(newObj);
    const score = this.convertDatetimeToTimestamp(datetime);

    // 替换数据
    await this.client
      .multi() // 开启事务
      .zrem(key, oldMember) // 删除旧的
      .zadd(key, score.toString(), newMember) // 添加新的
      .exec(); // 执行
  }
}
