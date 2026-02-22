# chess-api v2 (alpha)

Modern rewrite of `anzemur/chess-api`.

## Why v2

- cleaner resource model (`/v2/games`)
- modern runtime (Node + Fastify + chess.js 1.x)
- explicit game state payloads
- easier to extend for auth, persistence, multiplayer rooms, ratings

## Run

```bash
cd v2
npm install
npm run dev
```

## API

### Create game
`POST /v2/games`

Body (optional):
```json
{ "mode": "pvp", "fen": "..." }
```

### Get state
`GET /v2/games/:id`

### List legal moves
`GET /v2/games/:id/moves`
`GET /v2/games/:id/moves?from=e2`

### Make move
`POST /v2/games/:id/moves`

Body:
```json
{ "from": "e2", "to": "e4" }
```
or
```json
{ "san": "Nf3" }
```

## Next steps to ship beta

1. persistence (Redis/Postgres)
2. auth + rate limiting
3. one-player engine endpoint
4. tests + OpenAPI + CI
5. migration shim from v1 routes
