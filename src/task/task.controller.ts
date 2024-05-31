import { Controller, Get } from '@nestjs/common';
import { TaskService } from './task.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TaskDto } from './dto/task.dto';

@ApiTags('Task')
@Controller('task')
export class TaskController {
  constructor(private taskService: TaskService) {}

  @Get()
  @ApiOperation({ summary: '获取定时任务列表' })
  @ApiResponse({
    status: 200,
    description: '获取定时任务列表',
    type: [TaskDto],
  })
  getTasks() {
    return this.taskService.getTasks();
  }
}
