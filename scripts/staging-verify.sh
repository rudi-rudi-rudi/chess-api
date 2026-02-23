#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-}"
GOOGLE_ID_TOKEN="${GOOGLE_ID_TOKEN:-}"
ACCESS_TOKEN="${ACCESS_TOKEN:-}"
STRIPE_TEST_PRICE_ID="${STRIPE_TEST_PRICE_ID:-}"

if [[ -z "$API_BASE_URL" ]]; then
  echo "❌ Missing API_BASE_URL"
  echo "Usage: API_BASE_URL=https://stg-api.example.com GOOGLE_ID_TOKEN=<token> bash scripts/staging-verify.sh"
  echo "   or: API_BASE_URL=https://stg-api.example.com ACCESS_TOKEN=<session_token> bash scripts/staging-verify.sh"
  exit 1
fi

if [[ -z "$GOOGLE_ID_TOKEN" && -z "$ACCESS_TOKEN" ]]; then
  echo "❌ Missing auth input"
  echo "Provide GOOGLE_ID_TOKEN (preferred) or ACCESS_TOKEN."
  exit 1
fi

echo "== Staging verification: $API_BASE_URL =="

echo "1) Health check"
curl -fsS "$API_BASE_URL/" >/dev/null

if [[ -n "$GOOGLE_ID_TOKEN" ]]; then
  echo "2) Auth login"
  LOGIN_JSON=$(curl -fsS -X POST "$API_BASE_URL/auth/google" \
    -H 'content-type: application/json' \
    -d "{\"idToken\":\"$GOOGLE_ID_TOKEN\"}")
  ACCESS_TOKEN=$(node -e "const x=JSON.parse(process.argv[1]);console.log(x.accessToken||'')" "$LOGIN_JSON")
  if [[ -z "$ACCESS_TOKEN" ]]; then
    echo "❌ Login failed: no access token"
    echo "$LOGIN_JSON"
    exit 1
  fi
else
  echo "2) Auth login skipped (ACCESS_TOKEN provided)"
fi

echo "3) Profile + plan"
curl -fsS "$API_BASE_URL/me" -H "Authorization: Bearer $ACCESS_TOKEN" >/dev/null
curl -fsS "$API_BASE_URL/me/plan" -H "Authorization: Bearer $ACCESS_TOKEN" >/dev/null

echo "4) API key lifecycle (create/list/revoke)"
KEY_JSON=$(curl -fsS -X POST "$API_BASE_URL/me/api-keys" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'content-type: application/json' \
  -d '{"name":"staging-verify"}')
API_KEY=$(node -e "const x=JSON.parse(process.argv[1]);console.log(x.apiKey||'')" "$KEY_JSON")
if [[ -z "$API_KEY" ]]; then
  echo "❌ API key creation failed"
  echo "$KEY_JSON"
  exit 1
fi

LIST_JSON=$(curl -fsS "$API_BASE_URL/me/api-keys" -H "Authorization: Bearer $ACCESS_TOKEN")
KEY_ID=$(node -e "const x=JSON.parse(process.argv[1]); const i=(x.items||[]).find((k)=>k.keyPrefix===process.argv[2].slice(0,12)); console.log(i?.id||'')" "$LIST_JSON" "$API_KEY")
if [[ -z "$KEY_ID" ]]; then
  echo "❌ API key list missing created key"
  echo "$LIST_JSON"
  exit 1
fi

echo "5) Game flow"
GAME_JSON=$(curl -fsS -X POST "$API_BASE_URL/games" \
  -H "x-api-key: $API_KEY" \
  -H 'content-type: application/json' \
  -d '{"mode":"pve","aiColor":"b","timeControl":{"initialSeconds":120,"incrementSeconds":1}}')
GAME_ID=$(node -e "const x=JSON.parse(process.argv[1]);console.log(x.id||'')" "$GAME_JSON")
if [[ -z "$GAME_ID" ]]; then
  echo "❌ Game creation failed"
  echo "$GAME_JSON"
  exit 1
fi

curl -fsS -X POST "$API_BASE_URL/games/$GAME_ID/moves" \
  -H "x-api-key: $API_KEY" \
  -H 'content-type: application/json' \
  -d '{"from":"e2","to":"e4"}' >/dev/null

curl -fsS -X POST "$API_BASE_URL/games/$GAME_ID/ai-move" \
  -H "x-api-key: $API_KEY" >/dev/null

curl -fsS -X POST "$API_BASE_URL/games/$GAME_ID/resign" \
  -H "x-api-key: $API_KEY" \
  -H 'content-type: application/json' \
  -d '{"color":"w"}' >/dev/null

curl -fsS -X DELETE "$API_BASE_URL/me/api-keys/$KEY_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" >/dev/null

if [[ -n "$STRIPE_TEST_PRICE_ID" ]]; then
  echo "6) Billing endpoints"
  CHECKOUT_JSON=$(curl -fsS -X POST "$API_BASE_URL/billing/checkout-session" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H 'content-type: application/json' \
    -d "{\"priceId\":\"$STRIPE_TEST_PRICE_ID\"}")
  CHECKOUT_URL=$(node -e "const x=JSON.parse(process.argv[1]);console.log(x.url||'')" "$CHECKOUT_JSON")
  if [[ -z "$CHECKOUT_URL" ]]; then
    echo "❌ Billing checkout session failed"
    echo "$CHECKOUT_JSON"
    exit 1
  fi

  PORTAL_JSON=$(curl -fsS -X POST "$API_BASE_URL/billing/portal-session" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
  PORTAL_URL=$(node -e "const x=JSON.parse(process.argv[1]);console.log(x.url||'')" "$PORTAL_JSON")
  if [[ -z "$PORTAL_URL" ]]; then
    echo "❌ Billing portal session failed"
    echo "$PORTAL_JSON"
    exit 1
  fi
fi

echo "✅ Staging verification passed (auth + api key lifecycle + game flow${STRIPE_TEST_PRICE_ID:+ + billing endpoints})"
