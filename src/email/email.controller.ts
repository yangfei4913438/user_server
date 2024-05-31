import { Body, Controller, Post } from '@nestjs/common';
import { EmailService } from './email.service';
import { RedisService } from '../redis/redis.service';
import { EmailDto } from './dto/email.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/decorators/public.decorator';

@ApiTags('Email')
@Controller('email')
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly redis: RedisService,
  ) {}

  @Public()
  @ApiOperation({ summary: '获取邮件验证码' })
  @Post('code')
  async sendEmailCode(@Body() data: EmailDto) {
    const { email } = data;

    // 生成验证码
    let code = Math.random().toString().slice(2, 8);

    // 如果验证码还没有过期，就把之前的继续返回过去
    const old_code = await this.redis.get(email);
    if (old_code) {
      code = old_code;
    }

    // 发送邮件
    await this.emailService.sendMail({
      to: email,
      subject: '登录验证码',
      html: `<p>你的登录验证码是 <strong>${code}</strong>，请在5分钟内使用，过期无法使用。</p>`,
    });

    // 存储到内存, 更新有效期
    await this.redis.set(email, code, 60 * 5);

    return '发送成功';
  }
}
