# chess-api (rewrite)

Production-style chess API with:
- Google social auth (users)
- API key management per user
- Chess game endpoints protected by API key
- PvP + PvE
- Timed games (clock + increment)
- Postgres + Drizzle

## Stack
- Fastify
- Drizzle ORM
- PostgreSQL
- chess.js
- chess-ai-kong (engine)

## Environment
Create `.env` with:

```env
DATABASE_URL=postgres://...
GOOGLE_CLIENT_ID=your-google-oauth-client-id
PORT=3000
```

## Run

```bash
npm install
npm run dev
```

## Auth flow
1. Client performs Google Sign-In and gets `idToken`
2. Call `POST /auth/google` with `{ "idToken": "..." }`
3. Receive `accessToken` (session bearer)
4. Use bearer token for `/me` + `/me/api-keys`
5. Use generated API key in `x-api-key` header for chess routes

## API overview

### Session auth routes
- `POST /auth/google`
- `GET /me`
- `GET /me/api-keys`
- `POST /me/api-keys`
- `DELETE /me/api-keys/:id`

### Chess routes (require `x-api-key`)
- `POST /games`
- `GET /games/:id`
- `DELETE /games/:id`
- `GET /games/:id/moves?from=e2`
- `POST /games/:id/moves`
- `POST /games/:id/ai-move`
- `POST /games/:id/resign`

### Create game example
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
