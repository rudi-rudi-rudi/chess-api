var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../../common/guards/api-key.guard.js';
import { ChessService } from './chess.service.js';
import { CreateGameDto } from './dto/create-game.dto.js';
import { MoveDto } from './dto/move.dto.js';
import { ResignDto } from './dto/resign.dto.js';
let ChessController = class ChessController {
    chess;
    constructor(chess) {
        this.chess = chess;
    }
    create(req, body) {
        return this.chess.create(req.apiUserId, body || {});
    }
    get(req, id) {
        return this.chess.get(req.apiUserId, id);
    }
    async remove(req, id) {
        await this.chess.remove(req.apiUserId, id);
        return { ok: true };
    }
    moves(req, id, from) {
        return this.chess.moves(req.apiUserId, id, from);
    }
    move(req, id, body) {
        return this.chess.makeMove(req.apiUserId, id, body || {});
    }
    aiMove(req, id) {
        return this.chess.makeAiMove(req.apiUserId, id);
    }
    resign(req, id, body) {
        return this.chess.makeResign(req.apiUserId, id, body.color);
    }
};
__decorate([
    Post(),
    __param(0, Req()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateGameDto]),
    __metadata("design:returntype", void 0)
], ChessController.prototype, "create", null);
__decorate([
    Get(':id'),
    __param(0, Req()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ChessController.prototype, "get", null);
__decorate([
    Delete(':id'),
    __param(0, Req()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChessController.prototype, "remove", null);
__decorate([
    Get(':id/moves'),
    __param(0, Req()),
    __param(1, Param('id')),
    __param(2, Query('from')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], ChessController.prototype, "moves", null);
__decorate([
    Post(':id/moves'),
    __param(0, Req()),
    __param(1, Param('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, MoveDto]),
    __metadata("design:returntype", void 0)
], ChessController.prototype, "move", null);
__decorate([
    Post(':id/ai-move'),
    __param(0, Req()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ChessController.prototype, "aiMove", null);
__decorate([
    Post(':id/resign'),
    __param(0, Req()),
    __param(1, Param('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, ResignDto]),
    __metadata("design:returntype", void 0)
], ChessController.prototype, "resign", null);
ChessController = __decorate([
    Controller('games'),
    UseGuards(ApiKeyGuard),
    __metadata("design:paramtypes", [ChessService])
], ChessController);
export { ChessController };
//# sourceMappingURL=chess.controller.js.map