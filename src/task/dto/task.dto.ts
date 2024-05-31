import { ApiProperty } from '@nestjs/swagger';

export class TaskDto {
  @ApiProperty({ description: '计划任务的ID' })
  id: string;
  @ApiProperty({ description: '计划任务的名称' })
  name: string;
  @ApiProperty({ description: '计划任务执行时间' })
  cronTime: string;
  @ApiProperty({ description: '下一次的执行时间' })
  next: string;
}
