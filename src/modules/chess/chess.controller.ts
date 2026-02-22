import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../../common/guards/api-key.guard.js';
import { ChessService } from './chess.service.js';
import { CreateGameDto } from './dto/create-game.dto.js';
import { MoveDto } from './dto/move.dto.js';
import { ResignDto } from './dto/resign.dto.js';
import { ListGamesDto } from './dto/list-games.dto.js';
import { ListPlayersDto } from './dto/list-players.dto.js';
import { CreatePlayerDto } from './dto/create-player.dto.js';
import { AssignPlayerDto } from './dto/assign-player.dto.js';
import { UpdatePlayerDto } from './dto/update-player.dto.js';

@Controller('games')
@UseGuards(ApiKeyGuard)
export class ChessController {
  constructor(private readonly chess: ChessService) {}

  @Get()
  list(@Req() req: any, @Query() query: ListGamesDto) {
    return this.chess.list(req.apiUserId, query || {});
  }

  @Get('/players')
  listPlayers(@Req() req: any, @Query() query: ListPlayersDto) {
    return this.chess.listPlayers(req.apiUserId, query || {});
  }

  @Post('/players')
  createPlayer(@Req() req: any, @Body() body: CreatePlayerDto) {
    return this.chess.createPlayer(req.apiUserId, body);
  }

  @Patch('/players/:playerId')
  updatePlayer(@Req() req: any, @Param('playerId') playerId: string, @Body() body: UpdatePlayerDto) {
    return this.chess.updatePlayer(req.apiUserId, playerId, body);
  }

  @Delete('/players/:playerId')
  async deletePlayer(@Req() req: any, @Param('playerId') playerId: string) {
    await this.chess.deletePlayer(req.apiUserId, playerId);
    return { ok: true };
  }

  @Post(':id/players')
  assignPlayer(@Req() req: any, @Param('id') id: string, @Body() body: AssignPlayerDto) {
    return this.chess.assignPlayerToGame(req.apiUserId, id, body);
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
