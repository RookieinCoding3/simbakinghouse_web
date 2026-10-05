let passed = 0
let failed = 0

export function test(name: string, run: () => void) {
  try {
    run()
    console.log(`PASS  ${name}`)
    passed++
  } catch (e) {
    console.log(`FAIL  ${name}`)
    console.log(`      ${String((e as Error)?.message || e).split('\n')[0]}`)
    failed++
  }
}

export function eq<T>(actual: T, expected: T, msg = '') {
  const a = JSON.stringify(actual)
  const b = JSON.stringify(expected)
  if (a !== b) throw new Error(`${msg} expected ${b}, got ${a}`)
}

export function ok(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg)
}

export function done() {
  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}
