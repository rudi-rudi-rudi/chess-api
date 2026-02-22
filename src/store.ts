import { Chess, type Square } from 'chess.js';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';

export type GameMode = 'pvp' | 'pve';
export type Color = 'w' | 'b';

export interface TimeControl {
  initialMs: number;
  incrementMs: number;
  remaining: Record<Color, number>;
  running: Color;
  lastTickAt: number;
}

export interface Game {
  id: string;
  mode: GameMode;
  chess: Chess;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'finished';
  result?: {
    reason: 'checkmate' | 'draw' | 'timeout' | 'resign';
    winner: Color | null;
  };
  timeControl: TimeControl | null;
  aiColor: Color | null;
}

export interface CreateGameInput {
  fen?: string;
  mode?: GameMode;
  aiColor?: Color;
  timeControl?: {
    initialSeconds: number;
    incrementSeconds?: number;
  };
}

const games = new Map<string, Game>();

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const chessAI: {
  play: (history: string[]) => string;
  setOptions: (opts: { depth?: number; monitor?: boolean; strategy?: string; timeout?: number }) => void;
} = require('chess-ai-kong');

chessAI.setOptions({
  depth: 3,
  monitor: false,
  strategy: 'basic',
  timeout: 5000
});

async function getStockfishBestMove(fen: string, moveTimeMs = 400): Promise<string | null> {
  return new Promise((resolve) => {
    const engine = spawn('stockfish');
    let settled = false;

    const done = (move: string | null) => {
      if (settled) return;
      settled = true;
      try {
        engine.stdin.write('quit\n');
      } catch {
        // ignore
      }
      engine.kill();
      resolve(move);
    };

    const timeout = setTimeout(() => done(null), Math.max(200, moveTimeMs + 1500));

    engine.once('error', () => {
      clearTimeout(timeout);
      done(null);
    });

    engine.stdout.setEncoding('utf8');
    engine.stdout.on('data', (chunk: string) => {
      const lines = chunk
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      for (const line of lines) {
        if (line === 'uciok') {
          engine.stdin.write('isready\n');
        } else if (line === 'readyok') {
          engine.stdin.write(`position fen ${fen}\n`);
          engine.stdin.write(`go movetime ${moveTimeMs}\n`);
        } else if (line.startsWith('bestmove ')) {
          clearTimeout(timeout);
          const move = line.split(' ')[1] ?? null;
          done(move && move !== '(none)' ? move : null);
        }
      }
    });

    engine.stdin.write('uci\n');
  });
}

function nowIso() {
  return new Date().toISOString();
}

function nowMs() {
  return Date.now();
}

function opposite(c: Color): Color {
  return c === 'w' ? 'b' : 'w';
}

export function createGame(input: CreateGameInput = {}): Game {
  const chess = new Chess();
  if (input.fen) chess.load(input.fen);

  const id = crypto.randomUUID();
  const turn = chess.turn();
  const game: Game = {
    id,
    mode: input.mode ?? 'pvp',
    chess,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    status: 'active',
    timeControl: input.timeControl
      ? {
          initialMs: Math.max(1, input.timeControl.initialSeconds) * 1000,
          incrementMs: Math.max(0, input.timeControl.incrementSeconds ?? 0) * 1000,
          remaining: {
            w: Math.max(1, input.timeControl.initialSeconds) * 1000,
            b: Math.max(1, input.timeControl.initialSeconds) * 1000
          },
          running: turn,
          lastTickAt: nowMs()
        }
      : null,
    aiColor: (input.mode ?? 'pvp') === 'pve' ? input.aiColor ?? 'b' : null
  };

  games.set(id, game);
  return game;
}

export function getGame(id: string): Game | undefined {
  return games.get(id);
}

export function deleteGame(id: string): boolean {
  return games.delete(id);
}

function finishIfGameOver(game: Game) {
  if (!game.chess.isGameOver()) return;

  game.status = 'finished';
  if (game.chess.isCheckmate()) {
    game.result = { reason: 'checkmate', winner: opposite(game.chess.turn()) };
    return;
  }

  game.result = { reason: 'draw', winner: null };
}

function applyClockTick(game: Game) {
  if (!game.timeControl || game.status !== 'active') return;

  const tc = game.timeControl;
  const now = nowMs();
  const elapsed = Math.max(0, now - tc.lastTickAt);
  tc.remaining[tc.running] = Math.max(0, tc.remaining[tc.running] - elapsed);
  tc.lastTickAt = now;

  if (tc.remaining[tc.running] <= 0) {
    game.status = 'finished';
    game.result = { reason: 'timeout', winner: opposite(tc.running) };
  }
}

function afterMove(game: Game, mover: Color) {
  if (game.timeControl) {
    const tc = game.timeControl;
    tc.remaining[mover] += tc.incrementMs;
    tc.running = game.chess.turn();
    tc.lastTickAt = nowMs();
  }

  finishIfGameOver(game);
  game.updatedAt = nowIso();
}

export function legalMoves(game: Game, from?: string) {
  applyClockTick(game);
  if (game.status !== 'active') return [];

  if (from) return game.chess.moves({ square: from as Square });
  return game.chess.moves();
}

export function makeMove(
  game: Game,
  payload: { san?: string; from?: string; to?: string; promotion?: 'q' | 'r' | 'b' | 'n' }
) {
  applyClockTick(game);
  if (game.status !== 'active') return { error: 'Game is already finished' } as const;

  const mover = game.chess.turn();
  const move = payload.san
    ? game.chess.move(payload.san)
    : payload.from && payload.to
      ? game.chess.move({ from: payload.from, to: payload.to, promotion: payload.promotion ?? 'q' })
      : null;

  if (!move) return { error: 'Illegal move' } as const;

  afterMove(game, mover);
  return { move } as const;
}

export async function aiMove(game: Game) {
  applyClockTick(game);
  if (game.status !== 'active') return { error: 'Game is already finished' } as const;
  if (game.mode !== 'pve') return { error: 'AI move only supported for pve games' } as const;
  if (game.aiColor !== game.chess.turn()) return { error: 'Not AI turn' } as const;

  const mover = game.chess.turn();
  const moves = game.chess.moves();
  if (!moves.length) {
    finishIfGameOver(game);
    return { error: 'No legal AI moves' } as const;
  }

  let move: ReturnType<Chess['move']> | null = null;

  // Preferred engine: Stockfish (UCI)
  const uciMove = await getStockfishBestMove(game.chess.fen());
  if (uciMove && uciMove.length >= 4) {
    const from = uciMove.slice(0, 2);
    const to = uciMove.slice(2, 4);
    const promotion = (uciMove.slice(4, 5) || undefined) as 'q' | 'r' | 'b' | 'n' | undefined;
    move = game.chess.move({ from, to, promotion });
  }

  // Fallback: legacy kong engine
  if (!move) {
    try {
      const history = game.chess.history();
      const san = chessAI.play(history);
      move = game.chess.move(san);
    } catch {
      move = null;
    }
  }

  // Final fallback: random legal move
  if (!move) {
    const pick = moves[Math.floor(Math.random() * moves.length)]!;
    move = game.chess.move(pick);
  }

  if (!move) return { error: 'AI failed to move' } as const;

  afterMove(game, mover);
  return { move } as const;
}

export function resign(game: Game, color: Color) {
  if (game.status !== 'active') return;
  game.status = 'finished';
  game.result = { reason: 'resign', winner: opposite(color) };
  game.updatedAt = nowIso();
}

export function state(game: Game) {
  applyClockTick(game);
  return {
    id: game.id,
    mode: game.mode,
    status: game.status,
    result: game.result ?? null,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
    fen: game.chess.fen(),
    pgn: game.chess.pgn(),
    turn: game.chess.turn(),
    legalMoveCount: game.chess.moves().length,
    history: game.chess.history({ verbose: true }),
    timeControl: game.timeControl
      ? {
          initialMs: game.timeControl.initialMs,
          incrementMs: game.timeControl.incrementMs,
          remaining: game.timeControl.remaining,
          running: game.timeControl.running
        }
      : null
  };
}
