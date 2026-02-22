# CHESS API SAAS PLAN (Execution Checklist)

## Goal
Ship a production-ready SaaS chess API where users can sign in, create API keys, and build apps without their own backend.

## Current State (done)
- [x] NestJS modular rewrite (auth/users/chess/database/health)
- [x] Postgres + Drizzle schemas
- [x] Google auth endpoint
- [x] API key create/list/revoke
- [x] Core chess routes (create/get/delete/moves/ai/resign)
- [x] Timed games support
- [x] DTO coverage + module tests + engine tests
- [x] SaaS landing/docs/login/dashboard scaffolding + wiring
- [x] Basic plan model + free-tier API key limits

## Remaining (must finish)

### 1) Billing + Entitlements (Stripe)
- [x] Stripe customer creation on first paid action
- [x] Checkout session endpoint
- [x] Billing portal endpoint
- [x] Webhook handler (subscription created/updated/canceled)
- [x] Persist plan tier/status in `plans`
- [x] Enforce plan limits:
  - [x] free: low RPM + low monthly requests + key cap
  - [x] pro: higher quotas

### 2) Production API hardening
- [x] Centralized exception filter + error shape
- [x] Request logging middleware with requestId
- [x] API key rate limit per key (not only global)
- [ ] Pagination DTOs + list endpoints:
  - [x] `GET /games` with filters/status/mode
  - [x] `GET /players` (or profile-scoped player listing)
- [x] Ownership checks on all mutable resources

### 3) Data model completion
- [x] `players` table (profile for app users)
- [x] `game_players` table (white/black participants)
- [x] Optional metadata fields for external app IDs

### 4) Docs + Developer onboarding
- [ ] “Get key in 60 seconds” flow docs
- [ ] Copy-paste SDK-style snippets (JS/TS + curl)
- [ ] Plan limits docs + upgrade path
- [ ] Error code catalog

### 5) Ops + deployment
- [ ] docker-compose for local Postgres + app
- [ ] env validation at boot
- [ ] CI workflow (build + test)
- [ ] Vercel deployment files/config
- [ ] staging verification script

### 6) QA checklist (before STG signoff)
- [ ] Google login works
- [ ] API key lifecycle works
- [ ] Game flow works (create->move->ai->resign)
- [ ] Clock timeout works
- [ ] Free-tier limits enforced
- [ ] Upgrade to pro updates limits
- [ ] Stripe webhook updates entitlements
- [ ] Docs examples execute successfully

## Work Rules
- Keep scope strictly to SaaS chess API.
- No extra features unless directly required for reliability, billing, or developer onboarding.
- Commit in small, verifiable increments.
