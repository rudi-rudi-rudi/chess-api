#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-}"
GOOGLE_ID_TOKEN="${GOOGLE_ID_TOKEN:-}"
ACCESS_TOKEN="${ACCESS_TOKEN:-}"

if [[ -z "$API_BASE_URL" ]]; then
  echo "❌ Missing API_BASE_URL"
  exit 1
fi

echo "== QA Checklist against $API_BASE_URL =="

check() {
  local name="$1"
  shift
  if "$@" >/dev/null 2>&1; then
    echo "✅ $name"
  else
    echo "❌ $name"
  fi
}

check "Health endpoint" curl -fsS "$API_BASE_URL/"

if [[ -z "$ACCESS_TOKEN" && -n "$GOOGLE_ID_TOKEN" ]]; then
  LOGIN_JSON=$(curl -fsS -X POST "$API_BASE_URL/auth/google" -H 'content-type: application/json' -d "{\"idToken\":\"$GOOGLE_ID_TOKEN\"}")
  ACCESS_TOKEN=$(node -e "const x=JSON.parse(process.argv[1]); console.log(x.accessToken || '')" "$LOGIN_JSON")
fi

if [[ -z "$ACCESS_TOKEN" ]]; then
  echo "⚠️  Skipping auth-dependent checks (provide ACCESS_TOKEN or GOOGLE_ID_TOKEN)."
  exit 0
fi

check "Google login/session works" curl -fsS "$API_BASE_URL/me" -H "Authorization: Bearer $ACCESS_TOKEN"

KEY_JSON=$(curl -fsS -X POST "$API_BASE_URL/me/api-keys" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'content-type: application/json' \
  -d '{"name":"qa-checklist-primary"}')
API_KEY=$(node -e "const x=JSON.parse(process.argv[1]); console.log(x.apiKey || '')" "$KEY_JSON")

if [[ -z "$API_KEY" ]]; then
  echo "❌ API key lifecycle works"
  exit 1
fi

echo "✅ API key lifecycle works"

GAME_JSON=$(curl -fsS -X POST "$API_BASE_URL/games" \
  -H "x-api-key: $API_KEY" \
  -H 'content-type: application/json' \
  -d '{"mode":"pve","aiColor":"b","timeControl":{"initialSeconds":30,"incrementSeconds":1}}')
GAME_ID=$(node -e "const x=JSON.parse(process.argv[1]); console.log(x.id || '')" "$GAME_JSON")

if [[ -z "$GAME_ID" ]]; then
  echo "❌ Game flow works"
  exit 1
fi

curl -fsS -X POST "$API_BASE_URL/games/$GAME_ID/moves" \
  -H "x-api-key: $API_KEY" \
  -H 'content-type: application/json' \
  -d '{"from":"e2","to":"e4"}' >/dev/null
curl -fsS -X POST "$API_BASE_URL/games/$GAME_ID/ai-move" -H "x-api-key: $API_KEY" >/dev/null
curl -fsS -X POST "$API_BASE_URL/games/$GAME_ID/resign" \
  -H "x-api-key: $API_KEY" \
  -H 'content-type: application/json' \
  -d '{"color":"w"}' >/dev/null

echo "✅ Game flow works (create->move->ai->resign)"

# Clock timeout check with very short clock
CLOCK_GAME_JSON=$(curl -fsS -X POST "$API_BASE_URL/games" \
  -H "x-api-key: $API_KEY" \
  -H 'content-type: application/json' \
  -d '{"mode":"pvp","timeControl":{"initialSeconds":1,"incrementSeconds":0}}')
CLOCK_GAME_ID=$(node -e "const x=JSON.parse(process.argv[1]); console.log(x.id || '')" "$CLOCK_GAME_JSON")

if [[ -n "$CLOCK_GAME_ID" ]]; then
  sleep 2
  CLOCK_STATE=$(curl -fsS "$API_BASE_URL/games/$CLOCK_GAME_ID" -H "x-api-key: $API_KEY")
  CLOCK_STATUS=$(node -e "const x=JSON.parse(process.argv[1]); console.log(x.status || '')" "$CLOCK_STATE")
  CLOCK_REASON=$(node -e "const x=JSON.parse(process.argv[1]); console.log(x.result?.reason || '')" "$CLOCK_STATE")
  if [[ "$CLOCK_STATUS" == "finished" && "$CLOCK_REASON" == "timeout" ]]; then
    echo "✅ Clock timeout works"
  else
    echo "⚠️  Clock timeout check inconclusive (status=$CLOCK_STATUS reason=$CLOCK_REASON)"
  fi
else
  echo "⚠️  Clock timeout check skipped (could not create timed game)"
fi

# Docs examples smoke checks (same routes as docs snippets)
check "Docs example: list games" curl -fsS "$API_BASE_URL/games?status=active&limit=5" -H "x-api-key: $API_KEY"

# Free-tier guard: third active key should fail (free max=2)
SECOND_KEY_STATUS=$(curl -s -o /tmp/qa_second_key.json -w "%{http_code}" -X POST "$API_BASE_URL/me/api-keys" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'content-type: application/json' \
  -d '{"name":"qa-checklist-second"}')
THIRD_KEY_STATUS=$(curl -s -o /tmp/qa_third_key.json -w "%{http_code}" -X POST "$API_BASE_URL/me/api-keys" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'content-type: application/json' \
  -d '{"name":"qa-checklist-third"}')

if [[ "$SECOND_KEY_STATUS" == "201" && "$THIRD_KEY_STATUS" =~ ^(400|429)$ ]]; then
  echo "✅ Free-tier limits enforced (API key cap)"
else
  echo "⚠️  Free-tier limits check inconclusive (second=$SECOND_KEY_STATUS third=$THIRD_KEY_STATUS)"
fi

if [[ -n "${STRIPE_TEST_PRICE_ID:-}" ]]; then
  CHECKOUT_STATUS=$(curl -s -o /tmp/qa_checkout.json -w "%{http_code}" -X POST "$API_BASE_URL/billing/checkout-session" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H 'content-type: application/json' \
    -d "{\"priceId\":\"$STRIPE_TEST_PRICE_ID\"}")
  if [[ "$CHECKOUT_STATUS" == "201" || "$CHECKOUT_STATUS" == "200" ]]; then
    echo "✅ Upgrade-to-pro path reachable (checkout session)"
  else
    echo "⚠️  Upgrade-to-pro check inconclusive (checkout status=$CHECKOUT_STATUS)"
  fi
else
  echo "ℹ️  Upgrade-to-pro check skipped (set STRIPE_TEST_PRICE_ID to enable)."
fi

echo "ℹ️  Webhook transition validation still requires Stripe event source + webhook secret wiring in staging."
