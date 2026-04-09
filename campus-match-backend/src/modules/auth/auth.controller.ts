import { Body, Controller, Get, Post } from '@nestjs/common';

import { LoginEmailDto } from './dto/login-email.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendEmailCodeDto } from './dto/send-email-code.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('email/send-code')
  sendEmailCode(@Body() body: SendEmailCodeDto) {
    return this.authService.sendEmailCode(body);
  }

  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('password/reset')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }

  @Post('login/email')
  loginByEmail(@Body() body: LoginEmailDto) {
    return this.authService.loginByEmail(body);
  }

  @Get('me')
  getCurrentUser() {
    return this.authService.getCurrentUser();
  }
}
