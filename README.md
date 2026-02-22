# ♟️ chess-api

General-purpose Chess API for external users.

- Player vs Player (`pvp`)
- Player vs Engine (`pve`)
- Timed games (initial time + increment)
- Clean game-centric routes

## Run

```bash
npm install
npm run dev
```

## API

### Health
- `GET /`
- `GET /api`

### Create game
`POST /games`

Example:
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
`GET /games/:id`

### Delete game
`DELETE /games/:id`

### List legal moves
- `GET /games/:id/moves`
- `GET /games/:id/moves?from=e2`

### Make move
`POST /games/:id/moves`

```json
{ "from": "e2", "to": "e4" }
```
or
```json
{ "san": "Nf3" }
```

### Engine move (uses chess-ai-kong)
`POST /games/:id/ai-move`

### Resign
`POST /games/:id/resign`

```json
{ "color": "w" }
```
