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

## Staging verification script
```bash
API_BASE_URL=https://stg-api.example.com \
GOOGLE_ID_TOKEN=<google_id_token> \
bash scripts/staging-verify.sh
```

## QA checklist runner (staging)
```bash
API_BASE_URL=https://stg-api.example.com \
GOOGLE_ID_TOKEN=<google_id_token> \
bash scripts/qa-checklist.sh
```
(Or provide `ACCESS_TOKEN` directly to skip login bootstrap.)

## Stripe webhook transition verifier (staging)
Use this after you have a real staged user + Stripe customer id.

```bash
API_BASE_URL=https://stg-api.example.com \
STRIPE_WEBHOOK_SECRET=whsec_xxx \
STRIPE_CUSTOMER_ID=cus_xxx \
USER_ID=<app_user_id> \
bash scripts/staging-webhook-verify.sh
```

Optional billing checks:
```bash
API_BASE_URL=https://stg-api.example.com \
GOOGLE_ID_TOKEN=<google_id_token> \
STRIPE_TEST_PRICE_ID=price_xxx \
bash scripts/qa-checklist.sh
```

## Landing page + docs + login + dashboard (shadcn-style UI)
A separate Next.js app lives in `web/` and is wired to the API.

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

### Vercel deploy (web)
`web/vercel.json` is included for Vercel deployment.

Required Vercel project env vars:
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

Suggested project root in Vercel: `web/`

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

## Plan limits + upgrade path

### Free
- API keys: **2 active keys**
- Rate limit: **30 requests/minute** per API key
- Monthly quota: **10,000 requests** per account

### Pro
- API keys: **20 active keys**
- Rate limit: **300 requests/minute** per API key
- Monthly quota: **1,000,000 requests** per account

### Upgrade
1. Create checkout session: `POST /billing/checkout-session`
2. Redirect user to returned Stripe URL
3. Stripe webhook updates plan to `pro` when subscription is active
4. User can manage billing via `POST /billing/portal-session`

Minimal checkout call:
```bash
curl -s -X POST http://localhost:3000/billing/checkout-session \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  -d '{}'
```

## Error code catalog
All API errors use a consistent shape:

```json
{
  "error": {
    "statusCode": 400,
    "code": "Bad Request",
    "message": "Human-readable message"
  },
  "path": "/games",
  "timestamp": "2026-02-22T22:00:00.000Z"
}
```

Common errors:
- `401 Unauthorized`
  - Missing/invalid bearer session (`/me`, `/billing/*`)
  - Missing/invalid `x-api-key` (`/games*`)
- `404 Not Found`
  - Game or player not found / not owned by caller
- `429 Too Many Requests`
  - API key RPM exceeded for current plan
  - Monthly request quota exceeded for current plan
- `400 Bad Request`
  - Validation failures (DTO constraints)
  - Missing billing config (e.g. Stripe price)
- `500 Internal Server Error`
  - Unhandled server-side failure
