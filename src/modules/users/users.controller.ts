import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../../common/guards/session.guard.js';
import { UsersService } from './users.service.js';

@Controller('me')
@UseGuards(SessionGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  me(@Req() req: any) {
    return { user: req.user };
  }

  @Get('api-keys')
  async list(@Req() req: any) {
    return { items: await this.users.listApiKeys(req.user.id) };
  }

  @Post('api-keys')
  create(@Req() req: any, @Body() body: { name?: string }) {
    return this.users.createApiKey(req.user.id, body?.name || 'default');
  }

  @Delete('api-keys/:id')
  async revoke(@Req() req: any, @Param('id') id: string) {
    await this.users.revokeApiKey(req.user.id, id);
    return { ok: true };
  }
}
