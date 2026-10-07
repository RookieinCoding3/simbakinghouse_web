#!/usr/bin/env bash
# Runs E2E suites inside scripts/test-env.sh, resetting the emulators
# between suites. Usage: e2e-suites.sh [suite ...]   (default: all)
set -u
cd "$(dirname "$0")/.."

ALL=(order-abuse admin admin-auth admin-users stock admin-orders admin-products admin-sale)
if [ $# -eq 0 ]; then SUITES=("${ALL[@]}"); else SUITES=("$@"); fi

FAILED=()
for suite in "${SUITES[@]}"; do
  echo
  echo "===== suite: $suite ====="
  node --input-type=module -e "const m = await import('./scripts/lib/emu.mjs'); await m.resetEmulators()"
  case "$suite" in
    order-abuse) node scripts/seed-order-abuse-product.mjs && node scripts/order-abuse.test.mjs ;;
    admin) node scripts/admin.test.mjs ;;
    admin-auth) node scripts/admin-auth.test.mjs ;;
    admin-users) node scripts/admin-users.test.mjs ;;
    stock) node scripts/stock.test.mjs ;;
    admin-orders) node scripts/admin-orders.test.mjs ;;
    admin-products) node scripts/admin-products.test.mjs ;;
    admin-sale) node scripts/admin-sale.test.mjs ;;
    *) echo "unknown suite: $suite"; false ;;
  esac
  [ $? -eq 0 ] || FAILED+=("$suite")
done

echo
if [ ${#FAILED[@]} -eq 0 ]; then
  echo "E2E: all suites passed (${SUITES[*]})"
else
  echo "E2E: FAILED suites: ${FAILED[*]}"
  exit 1
fi
