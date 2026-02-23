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
  -d '{"name":"qa-checklist"}')
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
echo "ℹ️  Clock timeout / upgrade-to-pro / webhook checks require staged env + waiting windows."
