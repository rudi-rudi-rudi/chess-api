import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  root() {
    return { ok: true, service: 'chess-api', docs: '/api' };
  }

  @Get('api')
  api() {
    return {
      message: 'Chess API (NestJS modular rewrite)',
      auth: ['POST /auth/google', 'GET /me', 'GET/POST/DELETE /me/api-keys'],
      chess: [
        'POST /games',
        'GET /games/:id',
        'DELETE /games/:id',
        'GET /games/:id/moves',
        'POST /games/:id/moves',
        'POST /games/:id/ai-move',
        'POST /games/:id/resign',
      ],
    };
  }
}
