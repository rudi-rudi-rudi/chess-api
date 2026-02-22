import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('google')
  google(@Body() body: { idToken?: string }) {
    return this.auth.loginWithGoogle(body.idToken || '');
  }
}
