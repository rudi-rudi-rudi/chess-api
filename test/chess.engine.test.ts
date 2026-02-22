import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, move, legalMoves, resign } from '../src/modules/chess/chess.engine.js';

test('create state and perform legal move', () => {
  const state = createState({ mode: 'pvp' });
  const res = move(state, { from: 'e2', to: 'e4' });
  assert.equal('error' in res, false);
  assert.equal(state.chess.turn(), 'b');
});

test('illegal move is rejected', () => {
  const state = createState({ mode: 'pvp' });
  const res = move(state, { from: 'e2', to: 'e5' });
  assert.equal('error' in res, true);
});

test('legal moves from e2 include e4 at start', () => {
  const state = createState({ mode: 'pvp' });
  const moves = legalMoves(state, 'e2');
  assert.ok(moves.includes('e4'));
});

test('resign ends game', () => {
  const state = createState({ mode: 'pvp' });
  resign(state, 'w');
  assert.equal(state.status, 'finished');
  assert.equal(state.result?.reason, 'resign');
  assert.equal(state.result?.winner, 'b');
});
