import { Module } from '@nestjs/common';
import { ChessController } from './chess.controller.js';
import { ChessService } from './chess.service.js';

@Module({
  controllers: [ChessController],
  providers: [ChessService],
})
export class ChessModule {}
