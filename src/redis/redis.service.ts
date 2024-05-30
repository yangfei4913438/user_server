import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;

  async onModuleInit() {
    this.client = createClient({
      socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT, 10),
      },
      database: parseInt(process.env.REDIS_DB, 10),
    });
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.disconnect();
  }

  // 获取结构化数据
  async getHash(hashKey: string): Promise<Record<string, string> | null> {
    const obj = await this.client.hGetAll(hashKey);
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
    await this.client.hSet(hashKey, serializedObj);
    if (ttl) {
      await this.client.expire(hashKey, ttl);
    }
  }

  // 哈希数组: 获取数组的全部数据
  async hash_list_get(key: string) {
    const results = [];
    const fields = await this.client.hKeys(key);
    for (const field of fields) {
      const value = await this.client.hGet(key, field);
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
      await this.client.hSet(key, item.id, JSON.stringify(item));
    }
    if (ttl) {
      await this.client.expire(key, ttl);
    }
  }

  // 追加一个元素到数组的尾部
  async hash_list_append(key: string, id: string, value: any) {
    await this.client.hSet(key, id, JSON.stringify(value));
  }

  // 删除数组中指定 ID 的元素
  async hash_list_del_by_id(key: string, id: string) {
    await this.client.hDel(key, id);
  }

  // 更新数组中指定 ID 的元素
  async hash_list_update_by_id(key: string, id: string, value: any) {
    const json_data = await this.client.hGet(key, id);
    const data = JSON.parse(json_data);
    const end = { ...data, ...value };
    await this.client.hSet(key, id, JSON.stringify(end));
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
}
