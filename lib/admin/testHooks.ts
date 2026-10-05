// Test-only fault injection for the admin E2E suite. NEXT_PUBLIC_TEST_HOOKS
// is inlined at build time and only set by scripts/test-env.sh, so in a
// real build this is `undefined !== '1'` → always false.
export function testFault(name: string): boolean {
  if (process.env.NEXT_PUBLIC_TEST_HOOKS !== '1' || typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem('__sbhFault') === name
  } catch {
    return false
  }
}
