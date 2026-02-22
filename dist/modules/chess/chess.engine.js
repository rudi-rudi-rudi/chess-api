import { Chess } from 'chess.js';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const chessAI = require('chess-ai-kong');
chessAI.setOptions({ depth: 3, monitor: false, strategy: 'basic', timeout: 5000 });
const opposite = (c) => (c === 'w' ? 'b' : 'w');
export function createState(input) {
    const chess = new Chess();
    if (input.fen)
        chess.load(input.fen);
    const turn = chess.turn();
    const tc = input.timeControl;
    const state = {
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
export function hydrate(row) {
    const chess = new Chess(row.fen);
    return {
        mode: row.mode,
        aiColor: row.aiColor,
        chess,
        status: row.status,
        result: row.resultReason ? { reason: row.resultReason, winner: row.resultWinner } : null,
        timeControl: row.initialMs !== null
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
export function serialize(s) {
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
export function tick(s) {
    if (!s.timeControl || s.status !== 'active')
        return;
    const now = Date.now();
    const elapsed = Math.max(0, now - s.timeControl.lastTickAt);
    s.timeControl.remaining[s.timeControl.running] = Math.max(0, s.timeControl.remaining[s.timeControl.running] - elapsed);
    s.timeControl.lastTickAt = now;
    if (s.timeControl.remaining[s.timeControl.running] <= 0) {
        s.status = 'finished';
        s.result = { reason: 'timeout', winner: opposite(s.timeControl.running) };
    }
}
function finalize(s, mover) {
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
export function legalMoves(s, from) {
    tick(s);
    if (s.status !== 'active')
        return [];
    return from ? s.chess.moves({ square: from }) : s.chess.moves();
}
export function move(s, payload) {
    tick(s);
    if (s.status !== 'active')
        return { error: 'Game is already finished' };
    const mover = s.chess.turn();
    let m = null;
    try {
        m = payload.san
            ? s.chess.move(payload.san)
            : payload.from && payload.to
                ? s.chess.move({ from: payload.from, to: payload.to, promotion: payload.promotion ?? 'q' })
                : null;
    }
    catch {
        m = null;
    }
    if (!m)
        return { error: 'Illegal move' };
    finalize(s, mover);
    return { move: m };
}
export async function aiMove(s) {
    tick(s);
    if (s.status !== 'active')
        return { error: 'Game is already finished' };
    if (s.mode !== 'pve')
        return { error: 'AI move only supported for pve games' };
    if (s.aiColor !== s.chess.turn())
        return { error: 'Not AI turn' };
    const mover = s.chess.turn();
    const legal = s.chess.moves();
    if (!legal.length)
        return { error: 'No legal AI moves' };
    let m = null;
    try {
        const san = chessAI.play(s.chess.history());
        m = s.chess.move(san);
    }
    catch {
        m = null;
    }
    if (!m)
        m = s.chess.move(legal[Math.floor(Math.random() * legal.length)]);
    if (!m)
        return { error: 'AI failed to move' };
    finalize(s, mover);
    return { move: m };
}
export function resign(s, color) {
    if (s.status !== 'active')
        return;
    s.status = 'finished';
    s.result = { reason: 'resign', winner: opposite(color) };
}
export function present(id, s) {
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
//# sourceMappingURL=chess.engine.js.map