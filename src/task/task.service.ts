import { Injectable } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { UserService } from '../user/user.service';
import { TaskDto } from './dto/task.dto';
import { formatDate } from '../utils/format';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class TaskService {
  constructor(
    private readonly userService: UserService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly redis: RedisService,
  ) {}

  // 获取当前的定时任务
  async getTasks(): Promise<TaskDto[]> {
    try {
      const cache = await this.redis.hash_list_get('tasks');
      if (cache && cache.length > 0) {
        return cache;
      }
      const tasks: TaskDto[] = [];
      const list = this.schedulerRegistry.getCronJobs().entries();
      for (const [name, job] of list) {
        // const row_id = await formatHash(name);
        const task = {
          id: name,
          name: name,
          cronTime: job.cronTime.toString(),
          next: null,
        };
        try {
          const date = job.nextDate().toJSDate();
          task.next = formatDate(date);
        } catch (e) {
          task.next = 'Error: ' + e;
        }
        tasks.push(task);
      }
      // 存内存, 缓存时间 1 小时
      await this.redis.hash_list_push('tasks', tasks, 60 * 60);
      // 返回数据
      return tasks;
    } catch (e) {
      //
      console.log('err:', e);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_5AM, {
    name: '定时删除超过30天没登陆的注销用户',
    timeZone: 'Asia/Shanghai', // 查询时区 https://momentjs.com/timezone/
  })
  clearUser() {
    return this.userService.deleteUser();
  }
}
