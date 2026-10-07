#!/usr/bin/env bash
# Runs a command against a real local Next server wired to the Firebase
# emulators (Firestore, Auth, Storage) — never production. Usage:
#
#   bash scripts/test-env.sh node scripts/admin.test.mjs
#   DEV=1 bash scripts/test-env.sh node scripts/repro.mjs     # next dev instead of build+start
#   SKIP_BUILD=1 bash scripts/test-env.sh ...                 # reuse the last .next-test build
#   PRE_BUILD="node scripts/seed-shop.mjs" bash scripts/test-env.sh ...   # seed before building
#
# Test builds go to .next-test (see next.config.js distDir), never .next.
set -euo pipefail
cd "$(dirname "$0")/.."

TEST_PORT=3100
PROJECT="demo-sbh-test"

for port in 8080 9099 9199 $TEST_PORT; do
  if lsof -i:$port -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port $port is already in use — aborting so this doesn't collide with something else." >&2
    exit 1
  fi
done

# Real enough in shape for firebase-admin's cert() to parse; never used to
# authenticate anything, since every *_EMULATOR_HOST below makes the Admin
# SDK talk to the emulators instead.
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
export NEXT_PUBLIC_FIREBASE_PROJECT_ID="$PROJECT"
export NEXT_PUBLIC_FIREBASE_API_KEY="fake-api-key"
export NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="$PROJECT.appspot.com"
export FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"
export NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"
export FIREBASE_AUTH_EMULATOR_HOST="127.0.0.1:9099"
export NEXT_PUBLIC_AUTH_EMULATOR_HOST="127.0.0.1:9099"
export FIREBASE_STORAGE_EMULATOR_HOST="127.0.0.1:9199"
export CRON_SECRET="test-cron-secret"
export NEXT_DIST_DIR=".next-test"
# Test-only code paths (lib/admin/testHooks.ts, lib/admin/readMetrics.ts) —
# inlined at build time, so they exist only in .next-test builds.
export NEXT_PUBLIC_TEST_HOOKS="1"
export NEXT_PUBLIC_FS_METRICS="1"
export BASE_URL="http://localhost:$TEST_PORT"
export GCLOUD_PROJECT="$PROJECT"

EMULATOR_PID=""
NEXT_PID=""
cleanup() {
  [ -n "$NEXT_PID" ] && kill "$NEXT_PID" 2>/dev/null || true
  [ -n "$EMULATOR_PID" ] && kill "$EMULATOR_PID" 2>/dev/null || true
  # firebase emulators:start spawns java children; make sure none linger.
  for port in 8080 9099 9199 $TEST_PORT; do
    lsof -ti:$port -sTCP:LISTEN 2>/dev/null | xargs kill 2>/dev/null || true
  done
}
trap cleanup EXIT

echo "[test-env] starting emulators (firestore, auth, storage) for $PROJECT..."
npx firebase emulators:start --only firestore,auth,storage --project "$PROJECT" \
  > /tmp/sbh-test-emulators.log 2>&1 &
EMULATOR_PID=$!

for port in 8080 9099 9199; do
  for _ in $(seq 1 60); do
    curl -s -o /dev/null "http://127.0.0.1:$port" && break
    sleep 1
  done
done
echo "[test-env] emulators ready."

if [ "${DEV:-}" = "1" ]; then
  echo "[test-env] starting next dev on :$TEST_PORT..."
  npx next dev -p $TEST_PORT > /tmp/sbh-test-next.log 2>&1 &
  NEXT_PID=$!
else
  # PRE_BUILD: seed data that must exist when ISR pages (/products) are
  # rendered at build time — see scripts/seed-shop.mjs.
  if [ -n "${PRE_BUILD:-}" ]; then
    echo "[test-env] pre-build: $PRE_BUILD"
    bash -c "$PRE_BUILD"
  fi
  if [ "${SKIP_BUILD:-}" != "1" ]; then
    echo "[test-env] building (NEXT_PUBLIC_* baked in pointing at the emulators)..."
    # next build adds "<distDir>/types/**" to tsconfig.json; don't let a test
    # build leave that edit behind in the working tree.
    cp tsconfig.json /tmp/sbh-tsconfig.backup.json
    npx next build > /tmp/sbh-test-build.log 2>&1 || { cp /tmp/sbh-tsconfig.backup.json tsconfig.json; tail -40 /tmp/sbh-test-build.log; exit 1; }
    cp /tmp/sbh-tsconfig.backup.json tsconfig.json
  fi
  echo "[test-env] starting next on :$TEST_PORT..."
  npx next start -p $TEST_PORT > /tmp/sbh-test-next.log 2>&1 &
  NEXT_PID=$!
fi

for _ in $(seq 1 90); do
  curl -s -o /dev/null "$BASE_URL/" && break
  sleep 1
done
echo "[test-env] server ready."
echo

"$@"
