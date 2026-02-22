import { Chess } from 'chess.js';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const chessAI = require('chess-ai-kong');
chessAI.setOptions({ depth: 3, monitor: false, strategy: 'basic', timeout: 5000 });
function opposite(c) {
    return c === 'w' ? 'b' : 'w';
}
export function newGameState(input) {
    const chess = new Chess();
    if (input.fen)
        chess.load(input.fen);
    const turn = chess.turn();
    return {
        mode: input.mode ?? 'pvp',
        aiColor: (input.mode ?? 'pvp') === 'pve' ? input.aiColor ?? 'b' : null,
        chess,
        status: 'active',
        result: null,
        timeControl: input.timeControl
            ? {
                initialMs: Math.max(1, input.timeControl.initialSeconds) * 1000,
                incrementMs: Math.max(0, input.timeControl.incrementSeconds ?? 0) * 1000,
                remaining: {
                    w: Math.max(1, input.timeControl.initialSeconds) * 1000,
                    b: Math.max(1, input.timeControl.initialSeconds) * 1000
                },
                running: turn,
                lastTickAt: Date.now()
            }
            : null
    };
}
export function hydrate(row) {
    const chess = new Chess(row.fen);
    const timeControl = row.initialMs && row.incrementMs !== null && row.remainingW !== null && row.remainingB !== null && row.running && row.lastTickAt
        ? {
            initialMs: row.initialMs,
            incrementMs: row.incrementMs,
            remaining: { w: row.remainingW, b: row.remainingB },
            running: row.running,
            lastTickAt: row.lastTickAt
        }
        : null;
    return {
        mode: row.mode,
        aiColor: row.aiColor ?? null,
        chess,
        status: row.status,
        result: row.resultReason
            ? { reason: row.resultReason, winner: row.resultWinner ?? null }
            : null,
        timeControl
    };
}
export function serialize(state) {
    return {
        mode: state.mode,
        aiColor: state.aiColor,
        fen: state.chess.fen(),
        pgn: state.chess.pgn(),
        turn: state.chess.turn(),
        status: state.status,
        resultReason: state.result?.reason ?? null,
        resultWinner: state.result?.winner ?? null,
        history: state.chess.history({ verbose: true }),
        initialMs: state.timeControl?.initialMs ?? null,
        incrementMs: state.timeControl?.incrementMs ?? null,
        remainingW: state.timeControl?.remaining.w ?? null,
        remainingB: state.timeControl?.remaining.b ?? null,
        running: state.timeControl?.running ?? null,
        lastTickAt: state.timeControl?.lastTickAt ?? null
    };
}
function finishIfGameOver(state) {
    if (!state.chess.isGameOver())
        return;
    state.status = 'finished';
    if (state.chess.isCheckmate()) {
        state.result = { reason: 'checkmate', winner: opposite(state.chess.turn()) };
        return;
    }
    state.result = { reason: 'draw', winner: null };
}
export function tick(state) {
    if (!state.timeControl || state.status !== 'active')
        return;
    const now = Date.now();
    const elapsed = Math.max(0, now - state.timeControl.lastTickAt);
    state.timeControl.remaining[state.timeControl.running] = Math.max(0, state.timeControl.remaining[state.timeControl.running] - elapsed);
    state.timeControl.lastTickAt = now;
    if (state.timeControl.remaining[state.timeControl.running] <= 0) {
        state.status = 'finished';
        state.result = { reason: 'timeout', winner: opposite(state.timeControl.running) };
    }
}
function afterMove(state, mover) {
    if (state.timeControl) {
        state.timeControl.remaining[mover] += state.timeControl.incrementMs;
        state.timeControl.running = state.chess.turn();
        state.timeControl.lastTickAt = Date.now();
    }
    finishIfGameOver(state);
}
export function legalMoves(state, from) {
    tick(state);
    if (state.status !== 'active')
        return [];
    return from ? state.chess.moves({ square: from }) : state.chess.moves();
}
export function makeMove(state, payload) {
    tick(state);
    if (state.status !== 'active')
        return { error: 'Game is already finished' };
    const mover = state.chess.turn();
    const move = payload.san
        ? state.chess.move(payload.san)
        : payload.from && payload.to
            ? state.chess.move({ from: payload.from, to: payload.to, promotion: payload.promotion ?? 'q' })
            : null;
    if (!move)
        return { error: 'Illegal move' };
    afterMove(state, mover);
    return { move };
}
export async function aiMove(state) {
    tick(state);
    if (state.status !== 'active')
        return { error: 'Game is already finished' };
    if (state.mode !== 'pve')
        return { error: 'AI move only supported for pve games' };
    if (state.aiColor !== state.chess.turn())
        return { error: 'Not AI turn' };
    const mover = state.chess.turn();
    const legal = state.chess.moves();
    if (!legal.length)
        return { error: 'No legal AI moves' };
    let move = null;
    try {
        const san = chessAI.play(state.chess.history());
        move = state.chess.move(san);
    }
    catch {
        move = null;
    }
    if (!move) {
        const pick = legal[Math.floor(Math.random() * legal.length)];
        move = state.chess.move(pick);
    }
    if (!move)
        return { error: 'AI failed to move' };
    afterMove(state, mover);
    return { move };
}
export function resign(state, color) {
    if (state.status !== 'active')
        return;
    state.status = 'finished';
    state.result = { reason: 'resign', winner: opposite(color) };
}
export function present(id, state) {
    tick(state);
    return {
        id,
        mode: state.mode,
        status: state.status,
        result: state.result,
        fen: state.chess.fen(),
        pgn: state.chess.pgn(),
        turn: state.chess.turn(),
        history: state.chess.history({ verbose: true }),
        timeControl: state.timeControl
            ? {
                initialMs: state.timeControl.initialMs,
                incrementMs: state.timeControl.incrementMs,
                remaining: state.timeControl.remaining,
                running: state.timeControl.running
            }
            : null
    };
}
