import { Controller, Post, Body, Query, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthLoginDto, AuthRegisterDto } from './dto/auth.dto';
import { Public } from '../decorators/public.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Public()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: '用户登陆' })
  @Post('login')
  async login(@Body() user: AuthLoginDto) {
    return this.authService.login(user);
  }

  @ApiOperation({ summary: '用户注册' })
  @Post('register')
  async register(@Body() body: AuthRegisterDto) {
    return this.authService.register(body);
  }

  @ApiOperation({ summary: '刷新访问token' })
  @Get('refresh')
  async refresh(@Query('refresh_token') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }
}
