# chess-api v2 (TypeScript)

Modern general-purpose chess API rewrite.

## Goals

- clean, minimal routes for external users
- player-vs-player and player-vs-engine support
- timed games with clocks + increment
- easy path to persistence/auth later

## Run

```bash
cd v2
npm install
npm run dev
```

## Core API

### Create game
`POST /v2/games`

Example body:
```json
{
  "mode": "pve",
  "aiColor": "b",
  "timeControl": {
    "initialSeconds": 300,
    "incrementSeconds": 2
  }
}
```

### Get game state
`GET /v2/games/:id`

### Delete game
`DELETE /v2/games/:id`

### List legal moves
`GET /v2/games/:id/moves`
`GET /v2/games/:id/moves?from=e2`

### Make move
`POST /v2/games/:id/moves`

Body (one of):
```json
{ "from": "e2", "to": "e4" }
```
```json
{ "san": "Nf3" }
```

### Ask engine to move (pve mode)
`POST /v2/games/:id/ai-move`

### Resign
`POST /v2/games/:id/resign`

```json
{ "color": "w" }
```

## Time controls

When enabled, each game tracks:
- white and black remaining time
- running side clock
- increment per move
- timeout result when a clock reaches 0

## Next

- add persistence (Redis/Postgres)
- add OpenAPI schema + validation
- add tests + CI
- add stronger chess engine for pve mode
