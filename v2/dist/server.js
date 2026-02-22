import Fastify from 'fastify';
import { createGame, getGame, toState } from './store.js';
const app = Fastify({ logger: true });
app.get('/', async () => ({
    ok: true,
    service: 'chess-api-v2',
    docs: '/v2'
}));
app.get('/v2', async () => ({
    message: 'chess-api v2',
    endpoints: [
        'POST /v2/games',
        'GET /v2/games/:id',
        'POST /v2/games/:id/moves',
        'GET /v2/games/:id/moves?from=e2'
    ]
}));
app.post('/v2/games', async (req, reply) => {
    const body = (req.body ?? {});
    const game = createGame({ fen: body.fen, mode: body.mode ?? 'pvp' });
    reply.code(201);
    return toState(game);
});
app.get('/v2/games/:id', async (req, reply) => {
    const params = req.params;
    const game = getGame(params.id);
    if (!game)
        return reply.code(404).send({ error: 'Game not found' });
    return toState(game);
});
app.get('/v2/games/:id/moves', async (req, reply) => {
    const params = req.params;
    const query = (req.query ?? {});
    const game = getGame(params.id);
    if (!game)
        return reply.code(404).send({ error: 'Game not found' });
    const moves = query.from
        ? game.chess.moves({ square: query.from })
        : game.chess.moves();
    return { gameId: game.id, count: moves.length, moves };
});
app.post('/v2/games/:id/moves', async (req, reply) => {
    const params = req.params;
    const body = (req.body ?? {});
    const game = getGame(params.id);
    if (!game)
        return reply.code(404).send({ error: 'Game not found' });
    const { from, to, promotion = 'q', san } = body;
    if (!san && (!from || !to)) {
        return reply.code(400).send({ error: 'Provide san OR from+to' });
    }
    const move = san
        ? game.chess.move(san)
        : game.chess.move({ from: from, to: to, promotion: promotion });
    if (!move)
        return reply.code(422).send({ error: 'Illegal move' });
    game.updatedAt = new Date().toISOString();
    return { move, state: toState(game) };
});
const port = Number(process.env.PORT || 3000);
app.listen({ port, host: '0.0.0.0' }).then(() => {
    app.log.info(`chess-api-v2 listening on ${port}`);
});
