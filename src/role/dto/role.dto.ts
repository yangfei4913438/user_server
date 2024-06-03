import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

type RoleType = 'administrator' | 'editor' | 'member' | 'guest';

export class RoleDto {
  @ApiProperty({ description: '角色类型', uniqueItems: true, required: true })
  @IsNotEmpty()
  type: RoleType;

  @ApiProperty({ description: '角色名称', required: true })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '角色描述' })
  @IsOptional()
  description: string;
}

export class RoleUpdateDto extends RoleDto {
  @ApiProperty({ description: '角色ID', uniqueItems: true, required: true })
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: '角色类型', uniqueItems: true, required: true })
  @IsOptional()
  type: RoleType;

  @ApiProperty({ description: '角色名称', required: true })
  @IsOptional()
  name: string;
}

export class Role extends RoleDto {
  @ApiProperty({ description: '角色ID', uniqueItems: true, required: true })
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}
