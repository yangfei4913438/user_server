import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

export const handleDatabaseError = (
  error: any,
  defaultErrorMessage: string = '发生了一个意外错误',
): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // 处理已知的 Prisma 错误
    switch (error.code) {
      case 'P2002':
        throw new BadRequestException(
          `字段上的唯一约束失败，${error.meta.target}`,
        ); // Unique constraint failed on the field
      case 'P2003':
        throw new BadRequestException(`外键约束失败, ${error.meta.target}`); // Foreign key constraint failed
      case 'P2025':
        throw new BadRequestException(`记录不存在`); // Record not found
      case 'P2006':
        throw new BadRequestException(`无效数据`); // Invalid data
      case 'P2007':
        throw new BadRequestException('验证错误'); // Validation error
      case 'P2008':
        throw new BadRequestException('查询错误'); // Query error
      case 'P2009':
        throw new BadRequestException('事务错误'); // Transaction error
      case 'P2011':
        throw new BadRequestException('未提供所需值'); // Required value not provided
      // 添加其他 Prisma 错误码处理逻辑
      default:
        throw new InternalServerErrorException(
          `数据库内部错误: ${error.message}`,
        ); // Database error
    }
  } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    throw new InternalServerErrorException('未知数据库错误'); // Unknown database error
  } else if (error instanceof Prisma.PrismaClientRustPanicError) {
    throw new InternalServerErrorException('数据库崩溃错误'); // Database panic error
  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    throw new InternalServerErrorException('数据库初始化错误'); // Database initialization error
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    throw new BadRequestException('数据库验证错误'); // Database validation error
  } else {
    throw new InternalServerErrorException(defaultErrorMessage);
  }
};
