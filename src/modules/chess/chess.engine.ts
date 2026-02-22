import { Chess, type Square } from 'chess.js';
import { createRequire } from 'node:module';

export type GameMode = 'pvp' | 'pve';
export type Color = 'w' | 'b';

const require = createRequire(import.meta.url);
const chessAI: { play: (history: string[]) => string; setOptions: (opts: any) => void } = require('chess-ai-kong');
chessAI.setOptions({ depth: 3, monitor: false, strategy: 'basic', timeout: 5000 });

export type GameState = {
  mode: GameMode;
  aiColor: Color | null;
  chess: Chess;
  status: 'active' | 'finished';
  result: { reason: 'checkmate' | 'draw' | 'timeout' | 'resign'; winner: Color | null } | null;
  timeControl: null | {
    initialMs: number;
    incrementMs: number;
    remaining: Record<Color, number>;
    running: Color;
    lastTickAt: number;
  };
};

const opposite = (c: Color): Color => (c === 'w' ? 'b' : 'w');

export function createState(input: { mode?: GameMode; fen?: string; aiColor?: Color; timeControl?: { initialSeconds: number; incrementSeconds?: number } }) {
  const chess = new Chess();
  if (input.fen) chess.load(input.fen);
  const turn = chess.turn();
  const tc = input.timeControl;

  const state: GameState = {
    mode: input.mode ?? 'pvp',
    aiColor: (input.mode ?? 'pvp') === 'pve' ? input.aiColor ?? 'b' : null,
    chess,
    status: 'active',
    result: null,
    timeControl: tc
      ? {
          initialMs: tc.initialSeconds * 1000,
          incrementMs: (tc.incrementSeconds ?? 0) * 1000,
          remaining: { w: tc.initialSeconds * 1000, b: tc.initialSeconds * 1000 },
          running: turn,
          lastTickAt: Date.now(),
        }
      : null,
  };
  return state;
}

export function hydrate(row: any): GameState {
  const chess = new Chess(row.fen);
  return {
    mode: row.mode,
    aiColor: row.aiColor,
    chess,
    status: row.status,
    result: row.resultReason ? { reason: row.resultReason, winner: row.resultWinner } : null,
    timeControl:
      row.initialMs !== null
        ? {
            initialMs: row.initialMs,
            incrementMs: row.incrementMs,
            remaining: { w: row.remainingW, b: row.remainingB },
            running: row.running,
            lastTickAt: row.lastTickAt,
          }
        : null,
  };
}

export function serialize(s: GameState) {
  return {
    mode: s.mode,
    aiColor: s.aiColor,
    fen: s.chess.fen(),
    pgn: s.chess.pgn(),
    turn: s.chess.turn(),
    status: s.status,
    resultReason: s.result?.reason ?? null,
    resultWinner: s.result?.winner ?? null,
    history: s.chess.history({ verbose: true }),
    initialMs: s.timeControl?.initialMs ?? null,
    incrementMs: s.timeControl?.incrementMs ?? null,
    remainingW: s.timeControl?.remaining.w ?? null,
    remainingB: s.timeControl?.remaining.b ?? null,
    running: s.timeControl?.running ?? null,
    lastTickAt: s.timeControl?.lastTickAt ?? null,
  };
}

export function tick(s: GameState) {
  if (!s.timeControl || s.status !== 'active') return;
  const now = Date.now();
  const elapsed = Math.max(0, now - s.timeControl.lastTickAt);
  s.timeControl.remaining[s.timeControl.running] = Math.max(0, s.timeControl.remaining[s.timeControl.running] - elapsed);
  s.timeControl.lastTickAt = now;
  if (s.timeControl.remaining[s.timeControl.running] <= 0) {
    s.status = 'finished';
    s.result = { reason: 'timeout', winner: opposite(s.timeControl.running) };
  }
}

function finalize(s: GameState, mover: Color) {
  if (s.timeControl) {
    s.timeControl.remaining[mover] += s.timeControl.incrementMs;
    s.timeControl.running = s.chess.turn();
    s.timeControl.lastTickAt = Date.now();
  }
  if (s.chess.isGameOver()) {
    s.status = 'finished';
    s.result = s.chess.isCheckmate() ? { reason: 'checkmate', winner: opposite(s.chess.turn()) } : { reason: 'draw', winner: null };
  }
}

export function legalMoves(s: GameState, from?: string) {
  tick(s);
  if (s.status !== 'active') return [] as string[];
  return from ? s.chess.moves({ square: from as Square }) : s.chess.moves();
}

export function move(s: GameState, payload: { san?: string; from?: string; to?: string; promotion?: 'q' | 'r' | 'b' | 'n' }) {
  tick(s);
  if (s.status !== 'active') return { error: 'Game is already finished' } as const;
  const mover = s.chess.turn();
  const m = payload.san ? s.chess.move(payload.san) : payload.from && payload.to ? s.chess.move({ from: payload.from, to: payload.to, promotion: payload.promotion ?? 'q' }) : null;
  if (!m) return { error: 'Illegal move' } as const;
  finalize(s, mover);
  return { move: m } as const;
}

export async function aiMove(s: GameState) {
  tick(s);
  if (s.status !== 'active') return { error: 'Game is already finished' } as const;
  if (s.mode !== 'pve') return { error: 'AI move only supported for pve games' } as const;
  if (s.aiColor !== s.chess.turn()) return { error: 'Not AI turn' } as const;

  const mover = s.chess.turn();
  const legal = s.chess.moves();
  if (!legal.length) return { error: 'No legal AI moves' } as const;

  let m: ReturnType<Chess['move']> | null = null;
  try {
    const san = chessAI.play(s.chess.history());
    m = s.chess.move(san);
  } catch {
    m = null;
  }
  if (!m) m = s.chess.move(legal[Math.floor(Math.random() * legal.length)]!);
  if (!m) return { error: 'AI failed to move' } as const;
  finalize(s, mover);
  return { move: m } as const;
}

export function resign(s: GameState, color: Color) {
  if (s.status !== 'active') return;
  s.status = 'finished';
  s.result = { reason: 'resign', winner: opposite(color) };
}

export function present(id: string, s: GameState) {
  tick(s);
  return {
    id,
    mode: s.mode,
    status: s.status,
    result: s.result,
    fen: s.chess.fen(),
    pgn: s.chess.pgn(),
    turn: s.chess.turn(),
    history: s.chess.history({ verbose: true }),
    timeControl: s.timeControl
      ? { initialMs: s.timeControl.initialMs, incrementMs: s.timeControl.incrementMs, remaining: s.timeControl.remaining, running: s.timeControl.running }
      : null,
  };
}
