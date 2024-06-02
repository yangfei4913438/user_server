import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

type permissionType = 'admin' | 'create' | 'edit' | 'delete' | 'view';

export class PermissionDto {
  @ApiProperty({ description: '权限名称' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '权限类型' })
  @IsNotEmpty()
  type: permissionType;

  @ApiProperty({ description: '权限描述' })
  @IsOptional()
  description: string;
}

export class PermissionUpdateDto extends PermissionDto {
  @ApiProperty({ description: '权限ID', required: true })
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: '权限名称' })
  @IsOptional()
  name: string;

  @ApiProperty({ description: '权限类型' })
  @IsOptional()
  type: permissionType;
}

export class Permission extends PermissionDto {
  @ApiProperty({ description: '权限ID', uniqueItems: true, required: true })
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}
