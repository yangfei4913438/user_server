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

  // ZSET 有序集合
  // 将datetime字符串转换为UNIX时间戳（以毫秒为单位）
  private convertDatetimeToTimestamp(datetime: Date): number {
    const date = new Date(datetime);
    return date.getTime();
  }

  // 添加对象
  async appendObjectToZSet(
    key: string,
    value: any,
    ttl?: number,
  ): Promise<void> {
    // 转换时间为
    const score = this.convertDatetimeToTimestamp(value.createdTime);
    const member = this.serializeSortByObjectKey(value);
    await this.client.zadd(key, score.toString(), member);

    // 设置过期时间
    if (ttl) {
      await this.client.expire(key, ttl);
    }
  }

  // 批量添加
  async pushListToZSet(
    key: string,
    members: any[],
    ttl?: number,
  ): Promise<void> {
    // 使用一个 pipeline 来执行批量操作
    const pipeline = this.client.pipeline();
    for (const item of members) {
      const score = this.convertDatetimeToTimestamp(item.createdTime);
      const member = this.serializeSortByObjectKey(item);
      pipeline.zadd(key, score, member);
    }
    await pipeline.exec();
    if (ttl) {
      await this.client.expire(key, ttl);
    }
  }

  // 获取对象列表，正序
  async getObjectsFromZSetAsc(key: string): Promise<string[]> {
    // 正序排列
    const list = await this.client.zrange(key, 0, -1);
    return list.map((item) => JSON.parse(item));
  }

  // 获取对象列表，倒序
  async getObjectsFromZSetDesc(key: string): Promise<string[]> {
    // 倒序
    const list = await this.client.zrevrange(key, 0, -1);
    return list.map((item) => JSON.parse(item));
  }

  // 更新对象
  async updateObjectInZSet(
    key: string,
    oldObj: any,
    newObj: any,
    ttl?: number,
  ): Promise<void> {
    // 数据转换
    const oldMember = this.serializeSortByObjectKey(oldObj);
    const newMember = this.serializeSortByObjectKey(newObj);
    const score = this.convertDatetimeToTimestamp(oldObj.createdTime);

    // 替换数据
    await this.client
      .multi() // 开启事务
      .zrem(key, oldMember) // 删除旧的
      .zadd(key, score, newMember) // 添加新的
      .exec(); // 执行

    // 设置过期时间
    if (ttl) {
      await this.client.expire(key, ttl);
    }
  }

  // 删除一个对象
  async deleteObjectInZSet(key: string, oldObj: any): Promise<void> {
    // 数据转换
    const oldMember = this.serializeSortByObjectKey(oldObj);
    // 删除某个对象
    await this.client.zrem(key, oldMember);
  }

  // 序列化对象，确保对象的字段顺序一致
  private serializeSortByObjectKey(obj: Record<string, any>): string {
    const sortedObj = {};
    Object.keys(obj)
      .sort()
      .forEach((key) => {
        sortedObj[key] = obj[key];
      });
    return JSON.stringify(sortedObj);
  }
}
