# chess-api (NestJS rewrite)

Proper modular architecture with NestJS:

- `AuthModule` (Google login + sessions)
- `UsersModule` (API key management)
- `ChessModule` (game lifecycle, clocks, PvP/PvE)
- `DatabaseModule` (Postgres + Drizzle)
- `HealthModule` (root/docs)

## Tech
- NestJS
- PostgreSQL
- Drizzle ORM
- Google OAuth ID token verification
- chess.js + chess-ai-kong

## Env
```env
DATABASE_URL=postgres://...
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_...
APP_URL=http://localhost:3000
PORT=3000
```

## Run API
```bash
npm install
npm run dev
```

## Landing page + docs + login + dashboard (shadcn-style UI)
A separate Next.js app lives in `web/` and is wired to the API.

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

## Auth routes
- `POST /auth/google` with `{ idToken }`
- `GET /me` (Bearer session token)
- `GET /me/api-keys`
- `POST /me/api-keys`
- `DELETE /me/api-keys/:id`

## Chess routes (require `x-api-key`)
- `GET /games`
- `GET /games/players`
- `POST /games/players`
- `POST /games/:id/players`
- `POST /games`
- `GET /games/:id`
- `DELETE /games/:id`
- `GET /games/:id/moves`
- `POST /games/:id/moves`
- `POST /games/:id/ai-move`
- `POST /games/:id/resign`

## Get key in 60 seconds
1. **Sign in** via `POST /auth/google` with your Google ID token.
2. **Save bearer token** from `accessToken` in response.
3. **Create API key** via `POST /me/api-keys` using bearer auth.
4. **Call chess API** with `x-api-key: <returned apiKey>`.

Quick example:
```bash
# 1) Google login
curl -s -X POST http://localhost:3000/auth/google \
  -H "content-type: application/json" \
  -d '{"idToken":"<google-id-token>"}'

# 2) Create API key (replace $ACCESS_TOKEN)
curl -s -X POST http://localhost:3000/me/api-keys \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  -d '{"name":"quickstart"}'

# 3) Create a game (replace $API_KEY)
curl -s -X POST http://localhost:3000/games \
  -H "x-api-key: $API_KEY" \
  -H "content-type: application/json" \
  -d '{"mode":"pve","aiColor":"b"}'
```

