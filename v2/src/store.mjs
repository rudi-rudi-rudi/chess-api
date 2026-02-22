import { Chess } from 'chess.js';
import crypto from 'node:crypto';

const games = new Map();

export function createGame({ fen, mode = 'pvp' } = {}) {
  const chess = new Chess();
  if (fen) chess.load(fen);

  const id = crypto.randomUUID();
  const game = {
    id,
    mode,
    chess,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  games.set(id, game);
  return game;
}

export function getGame(id) {
  return games.get(id);
}

export function toState(game) {
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
