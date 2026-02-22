var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service.js';
let SessionGuard = class SessionGuard {
    auth;
    constructor(auth) {
        this.auth = auth;
    }
    async canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const session = await this.auth.sessionFromBearer(req.headers.authorization);
        if (!session)
            throw new UnauthorizedException('Invalid session');
        req.user = { id: session.userId, email: session.email, name: session.name };
        return true;
    }
};
SessionGuard = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [AuthService])
], SessionGuard);
export { SessionGuard };
//# sourceMappingURL=session.guard.js.map