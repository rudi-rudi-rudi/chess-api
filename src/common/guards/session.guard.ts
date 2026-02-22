import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service.js';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const session = await this.auth.sessionFromBearer(req.headers.authorization);
    if (!session) throw new UnauthorizedException('Invalid session');
    req.user = { id: session.userId, email: session.email, name: session.name };
    return true;
  }
}
