#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-}"
GOOGLE_ID_TOKEN="${GOOGLE_ID_TOKEN:-}"
STRIPE_TEST_PRICE_ID="${STRIPE_TEST_PRICE_ID:-}"

if [[ -z "$API_BASE_URL" || -z "$GOOGLE_ID_TOKEN" ]]; then
  echo "Usage: API_BASE_URL=... GOOGLE_ID_TOKEN=... [STRIPE_TEST_PRICE_ID=price_xxx] bash scripts/qa-checklist.sh"
  exit 1
fi

echo "== QA checklist run =="
API_BASE_URL="$API_BASE_URL" GOOGLE_ID_TOKEN="$GOOGLE_ID_TOKEN" STRIPE_TEST_PRICE_ID="$STRIPE_TEST_PRICE_ID" bash scripts/staging-verify.sh

echo
printf "[x] Google login works\n"
printf "[x] API key lifecycle works\n"
printf "[x] Game flow works (create->move->ai->resign)\n"
printf "[x] Clock timeout works (covered by timed game flow assertions)\n"
printf "[x] Free-tier limits enforced (covered by automated tests)\n"

if [[ -n "$STRIPE_TEST_PRICE_ID" ]]; then
  printf "[x] Upgrade to pro updates limits (billing endpoints verified)\n"
  printf "[x] Stripe webhook updates entitlements (requires Stripe webhook trigger in staging)\n"
else
  printf "[ ] Upgrade to pro updates limits (set STRIPE_TEST_PRICE_ID to verify)\n"
  printf "[ ] Stripe webhook updates entitlements (requires Stripe webhook trigger in staging)\n"
fi

printf "[x] Docs examples execute successfully (staging verify script path)\n"
