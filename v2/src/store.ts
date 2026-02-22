import { Chess } from 'chess.js';
import crypto from 'node:crypto';

export type GameMode = 'pvp' | 'pve';

export interface Game {
  id: string;
  mode: GameMode;
  chess: Chess;
  createdAt: string;
  updatedAt: string;
}

const games = new Map<string, Game>();

export function createGame({ fen, mode = 'pvp' }: { fen?: string; mode?: GameMode } = {}): Game {
  const chess = new Chess();
  if (fen) chess.load(fen);

  const id = crypto.randomUUID();
  const game: Game = {
    id,
    mode,
    chess,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  games.set(id, game);
  return game;
}

export function getGame(id: string): Game | undefined {
  return games.get(id);
}

export function toState(game: Game) {
  const { chess, id, mode, createdAt, updatedAt } = game;
  return {
    id,
    mode,
    createdAt,
    updatedAt,
    fen: chess.fen(),
    pgn: chess.pgn(),
    turn: chess.turn(),
    isGameOver: chess.isGameOver(),
    isCheckmate: chess.isCheckmate(),
    isDraw: chess.isDraw(),
    isStalemate: chess.isStalemate(),
    isThreefoldRepetition: chess.isThreefoldRepetition(),
    history: chess.history({ verbose: true })
  };
}
