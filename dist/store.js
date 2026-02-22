import { Chess } from 'chess.js';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
const games = new Map();
const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const chessAI = require('chess-ai-kong');
chessAI.setOptions({
    depth: 3,
    monitor: false,
    strategy: 'basic',
    timeout: 5000
});
async function getStockfishBestMove(fen, moveTimeMs = 400) {
    return new Promise((resolve) => {
        const engine = spawn('stockfish');
        let settled = false;
        const done = (move) => {
            if (settled)
                return;
            settled = true;
            try {
                engine.stdin.write('quit\n');
            }
            catch {
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
        engine.stdout.on('data', (chunk) => {
            const lines = chunk
                .split(/\r?\n/)
                .map((l) => l.trim())
                .filter(Boolean);
            for (const line of lines) {
                if (line === 'uciok') {
                    engine.stdin.write('isready\n');
                }
                else if (line === 'readyok') {
                    engine.stdin.write(`position fen ${fen}\n`);
                    engine.stdin.write(`go movetime ${moveTimeMs}\n`);
                }
                else if (line.startsWith('bestmove ')) {
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
function opposite(c) {
    return c === 'w' ? 'b' : 'w';
}
export function createGame(input = {}) {
    const chess = new Chess();
    if (input.fen)
        chess.load(input.fen);
    const id = crypto.randomUUID();
    const turn = chess.turn();
    const game = {
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
export function getGame(id) {
    return games.get(id);
}
export function deleteGame(id) {
    return games.delete(id);
}
function finishIfGameOver(game) {
    if (!game.chess.isGameOver())
        return;
    game.status = 'finished';
    if (game.chess.isCheckmate()) {
        game.result = { reason: 'checkmate', winner: opposite(game.chess.turn()) };
        return;
    }
    game.result = { reason: 'draw', winner: null };
}
function applyClockTick(game) {
    if (!game.timeControl || game.status !== 'active')
        return;
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
function afterMove(game, mover) {
    if (game.timeControl) {
        const tc = game.timeControl;
        tc.remaining[mover] += tc.incrementMs;
        tc.running = game.chess.turn();
        tc.lastTickAt = nowMs();
    }
    finishIfGameOver(game);
    game.updatedAt = nowIso();
}
export function legalMoves(game, from) {
    applyClockTick(game);
    if (game.status !== 'active')
        return [];
    if (from)
        return game.chess.moves({ square: from });
    return game.chess.moves();
}
export function makeMove(game, payload) {
    applyClockTick(game);
    if (game.status !== 'active')
        return { error: 'Game is already finished' };
    const mover = game.chess.turn();
    const move = payload.san
        ? game.chess.move(payload.san)
        : payload.from && payload.to
            ? game.chess.move({ from: payload.from, to: payload.to, promotion: payload.promotion ?? 'q' })
            : null;
    if (!move)
        return { error: 'Illegal move' };
    afterMove(game, mover);
    return { move };
}
export async function aiMove(game) {
    applyClockTick(game);
    if (game.status !== 'active')
        return { error: 'Game is already finished' };
    if (game.mode !== 'pve')
        return { error: 'AI move only supported for pve games' };
    if (game.aiColor !== game.chess.turn())
        return { error: 'Not AI turn' };
    const mover = game.chess.turn();
    const moves = game.chess.moves();
    if (!moves.length) {
        finishIfGameOver(game);
        return { error: 'No legal AI moves' };
    }
    let move = null;
    // Preferred engine: Stockfish (UCI)
    const uciMove = await getStockfishBestMove(game.chess.fen());
    if (uciMove && uciMove.length >= 4) {
        const from = uciMove.slice(0, 2);
        const to = uciMove.slice(2, 4);
        const promotion = (uciMove.slice(4, 5) || undefined);
        move = game.chess.move({ from, to, promotion });
    }
    // Fallback: legacy kong engine
    if (!move) {
        try {
            const history = game.chess.history();
            const san = chessAI.play(history);
            move = game.chess.move(san);
        }
        catch {
            move = null;
        }
    }
    // Final fallback: random legal move
    if (!move) {
        const pick = moves[Math.floor(Math.random() * moves.length)];
        move = game.chess.move(pick);
    }
    if (!move)
        return { error: 'AI failed to move' };
    afterMove(game, mover);
    return { move };
}
export function resign(game, color) {
    if (game.status !== 'active')
        return;
    game.status = 'finished';
    game.result = { reason: 'resign', winner: opposite(color) };
    game.updatedAt = nowIso();
}
export function state(game) {
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
