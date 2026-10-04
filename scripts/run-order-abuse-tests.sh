#!/usr/bin/env bash
# Runs scripts/order-abuse.test.mjs against a real local Next server and
# the Firestore emulator — never production. See TEST_PORT/EMULATOR_PORT
# below for exactly what's touched.
set -euo pipefail
cd "$(dirname "$0")/.."

TEST_PORT=3100
EMULATOR_PORT=8080
TEST_PROJECT="demo-sbh-order-abuse-test"

if lsof -i:$EMULATOR_PORT >/dev/null 2>&1; then
  echo "Port $EMULATOR_PORT is already in use — aborting so this doesn't collide with something else." >&2
  exit 1
fi
if lsof -i:$TEST_PORT >/dev/null 2>&1; then
  echo "Port $TEST_PORT is already in use — aborting so this doesn't collide with something else." >&2
  exit 1
fi

# A throwaway RSA key, real enough in shape for firebase-admin's cert() to
# parse — never used to actually authenticate anything, since
# FIRESTORE_EMULATOR_HOST below makes the Admin SDK skip auth entirely.
TEST_PRIVATE_KEY=$(node -e "
const { generateKeyPairSync } = require('crypto');
const { privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});
process.stdout.write(privateKey);
")

export FIREBASE_CLIENT_EMAIL="test-admin@example.com"
export FIREBASE_PRIVATE_KEY="$TEST_PRIVATE_KEY"
export NEXT_PUBLIC_FIREBASE_PROJECT_ID="$TEST_PROJECT"
export FIRESTORE_EMULATOR_HOST="localhost:$EMULATOR_PORT"
export NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST="localhost:$EMULATOR_PORT"

EMULATOR_PID=""
NEXT_PID=""
cleanup() {
  [ -n "$NEXT_PID" ] && kill "$NEXT_PID" 2>/dev/null || true
  [ -n "$EMULATOR_PID" ] && kill "$EMULATOR_PID" 2>/dev/null || true
}
trap cleanup EXIT

echo "Starting Firestore emulator on :$EMULATOR_PORT (project $TEST_PROJECT)..."
npx firebase emulators:start --only firestore --project "$TEST_PROJECT" \
  > /tmp/sbh-emulator-test.log 2>&1 &
EMULATOR_PID=$!

for _ in $(seq 1 30); do
  curl -s -o /dev/null "http://localhost:$EMULATOR_PORT" && break
  sleep 1
done
echo "Emulator ready."

echo "Seeding a test product..."
node scripts/seed-order-abuse-product.mjs

# Next.js inlines every NEXT_PUBLIC_* reference at BUILD time, including
# inside server-only files — `next start` alone would still run on
# whatever project ID/emulator host were baked in by the last real build.
# Rebuilding here, with the test env vars set, is what actually makes the
# Admin SDK and the client SDK's emulator hook (lib/firebase/config.ts)
# point at the emulator instead of production.
echo "Building with test env vars (so NEXT_PUBLIC_* bakes in pointing at the emulator)..."
npx next build > /tmp/sbh-build-test.log 2>&1

echo "Starting Next server on :$TEST_PORT against the emulator..."
npx next start -p $TEST_PORT > /tmp/sbh-next-test.log 2>&1 &
NEXT_PID=$!

for _ in $(seq 1 30); do
  curl -s -o /dev/null "http://localhost:$TEST_PORT/api/checkout/token" && break
  sleep 1
done
echo "Server ready."
echo

BASE_URL="http://localhost:$TEST_PORT" node scripts/order-abuse.test.mjs
