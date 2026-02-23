#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-}"
STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET:-}"
STRIPE_CUSTOMER_ID="${STRIPE_CUSTOMER_ID:-}"
USER_ID="${USER_ID:-}"

if [[ -z "$API_BASE_URL" || -z "$STRIPE_WEBHOOK_SECRET" || -z "$STRIPE_CUSTOMER_ID" || -z "$USER_ID" ]]; then
  echo "❌ Missing required envs."
  echo "Required: API_BASE_URL, STRIPE_WEBHOOK_SECRET, STRIPE_CUSTOMER_ID, USER_ID"
  echo "Optional: SUBSCRIPTION_ID (default=sub_test_123)"
  exit 1
fi

SUBSCRIPTION_ID="${SUBSCRIPTION_ID:-sub_test_123}"

payload_active=$(cat <<JSON
{"id":"evt_test_active","type":"customer.subscription.updated","data":{"object":{"id":"$SUBSCRIPTION_ID","customer":"$STRIPE_CUSTOMER_ID","status":"active","metadata":{"userId":"$USER_ID"}}}}
JSON
)

payload_canceled=$(cat <<JSON
{"id":"evt_test_canceled","type":"customer.subscription.deleted","data":{"object":{"id":"$SUBSCRIPTION_ID","customer":"$STRIPE_CUSTOMER_ID","status":"canceled","metadata":{"userId":"$USER_ID"}}}}
JSON
)

sign() {
  local payload="$1"
  local timestamp
  timestamp=$(date +%s)
  local signed
  signed="$timestamp.$payload"
  local sig
  sig=$(printf "%s" "$signed" | openssl dgst -sha256 -hmac "$STRIPE_WEBHOOK_SECRET" | sed 's/^.* //')
  printf 't=%s,v1=%s' "$timestamp" "$sig"
}

send_event() {
  local payload="$1"
  local header
  header=$(sign "$payload")
  curl -fsS -X POST "$API_BASE_URL/billing/webhook" \
    -H "content-type: application/json" \
    -H "stripe-signature: $header" \
    -d "$payload" >/dev/null
}

echo "== Webhook entitlement verification against $API_BASE_URL =="
echo "Sending active subscription event..."
send_event "$payload_active"

echo "Sending canceled subscription event..."
send_event "$payload_canceled"

echo "✅ Webhook events delivered. Now verify plan transition via:"
echo "curl -sS \"$API_BASE_URL/me/plan\" -H \"Authorization: Bearer <ACCESS_TOKEN>\""
