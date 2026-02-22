import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { GoogleLoginDto } from './dto/google-login.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('google')
  google(@Body() body: GoogleLoginDto) {
    return this.auth.loginWithGoogle(body.idToken);
  }
}
