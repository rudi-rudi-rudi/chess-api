import Fastify from 'fastify';
import {
  aiMove,
  createGame,
  deleteGame,
  getGame,
  legalMoves,
  makeMove,
  resign,
  state,
  type Color,
  type GameMode
} from './store.js';

const app = Fastify({ logger: true });

app.get('/', async () => ({ ok: true, service: 'chess-api', docs: '/api' }));

app.get('/api', async () => ({
  message: 'General Chess API',
  endpoints: [
    'POST /games',
    'GET /games/:id',
    'DELETE /games/:id',
    'GET /games/:id/moves?from=e2',
    'POST /games/:id/moves',
    'POST /games/:id/ai-move',
    'POST /games/:id/resign'
  ]
}));

app.post('/games', async (req, reply) => {
  const body = (req.body ?? {}) as {
    mode?: GameMode;
    fen?: string;
    aiColor?: Color;
    timeControl?: { initialSeconds: number; incrementSeconds?: number };
  };

  const game = createGame({
    mode: body.mode ?? 'pvp',
    fen: body.fen,
    aiColor: body.aiColor,
    timeControl: body.timeControl
  });

  reply.code(201);
  return state(game);
});

app.get('/games/:id', async (req, reply) => {
  const { id } = req.params as { id: string };
  const game = getGame(id);
  if (!game) return reply.code(404).send({ error: 'Game not found' });
  return state(game);
});

app.delete('/games/:id', async (req, reply) => {
  const { id } = req.params as { id: string };
  const ok = deleteGame(id);
  if (!ok) return reply.code(404).send({ error: 'Game not found' });
  return reply.code(204).send();
});

app.get('/games/:id/moves', async (req, reply) => {
  const { id } = req.params as { id: string };
  const { from } = (req.query ?? {}) as { from?: string };
  const game = getGame(id);
  if (!game) return reply.code(404).send({ error: 'Game not found' });

  const moves = legalMoves(game, from);
  return { gameId: id, from: from ?? null, count: moves.length, moves };
});

app.post('/games/:id/moves', async (req, reply) => {
  const { id } = req.params as { id: string };
  const body = (req.body ?? {}) as {
    san?: string;
    from?: string;
    to?: string;
    promotion?: 'q' | 'r' | 'b' | 'n';
  };

  const game = getGame(id);
  if (!game) return reply.code(404).send({ error: 'Game not found' });

  const result = makeMove(game, body);
  if ('error' in result) return reply.code(422).send(result);

  return { move: result.move, state: state(game) };
});

app.post('/games/:id/ai-move', async (req, reply) => {
  const { id } = req.params as { id: string };
  const game = getGame(id);
  if (!game) return reply.code(404).send({ error: 'Game not found' });

  const result = await aiMove(game);
  if ('error' in result) return reply.code(422).send(result);

  return { move: result.move, state: state(game) };
});

app.post('/games/:id/resign', async (req, reply) => {
  const { id } = req.params as { id: string };
  const body = (req.body ?? {}) as { color?: Color };
  const game = getGame(id);
  if (!game) return reply.code(404).send({ error: 'Game not found' });

  if (!body.color || !['w', 'b'].includes(body.color)) {
    return reply.code(400).send({ error: 'color must be w or b' });
  }

  resign(game, body.color);
  return state(game);
});

const port = Number(process.env.PORT || 3000);
app.listen({ port, host: '0.0.0.0' }).then(() => {
  app.log.info(`chess-api listening on ${port}`);
});
