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
PORT=3000
```

## Run API
```bash
npm install
npm run dev
```

## Landing page (shadcn-style UI)
A separate Next.js app lives in `web/`.

```bash
cd web
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
- `POST /games`
- `GET /games/:id`
- `DELETE /games/:id`
- `GET /games/:id/moves`
- `POST /games/:id/moves`
- `POST /games/:id/ai-move`
- `POST /games/:id/resign`
