import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../../common/guards/api-key.guard.js';
import { ChessService } from './chess.service.js';
import { CreateGameDto } from './dto/create-game.dto.js';
import { MoveDto } from './dto/move.dto.js';
import { ResignDto } from './dto/resign.dto.js';
import { ListGamesDto } from './dto/list-games.dto.js';

@Controller('games')
@UseGuards(ApiKeyGuard)
export class ChessController {
  constructor(private readonly chess: ChessService) {}

  @Get()
  list(@Req() req: any, @Query() query: ListGamesDto) {
    return this.chess.list(req.apiUserId, query || {});
  }

  @Post()
  create(@Req() req: any, @Body() body: CreateGameDto) {
    return this.chess.create(req.apiUserId, body || {});
  }

  @Get(':id')
  get(@Req() req: any, @Param('id') id: string) {
    return this.chess.get(req.apiUserId, id);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    await this.chess.remove(req.apiUserId, id);
    return { ok: true };
  }

  @Get(':id/moves')
  moves(@Req() req: any, @Param('id') id: string, @Query('from') from?: string) {
    return this.chess.moves(req.apiUserId, id, from);
  }

  @Post(':id/moves')
  move(@Req() req: any, @Param('id') id: string, @Body() body: MoveDto) {
    return this.chess.makeMove(req.apiUserId, id, body || {});
  }

  @Post(':id/ai-move')
  aiMove(@Req() req: any, @Param('id') id: string) {
    return this.chess.makeAiMove(req.apiUserId, id);
  }

  @Post(':id/resign')
  resign(@Req() req: any, @Param('id') id: string, @Body() body: ResignDto) {
    return this.chess.makeResign(req.apiUserId, id, body.color);
  }
}
