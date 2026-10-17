// Vercel Preview deployments must never touch the production Firebase
// project (sim-baking-house): their checkout would create real orders.
// Preview uses the staging project sim-baking-house-test (env vars set for
// the Preview target only; see sbh-inventory/docs/DEPLOY.md). If a Preview
// build is ever pointed at production by mistake, Firebase refuses to start
// there: the page/route fails instead of writing real data.

export const PROD_PROJECT_ID = 'sim-baking-house'

/** VERCEL_ENV of this build: 'production' | 'preview' | 'development' |
 *  '' (not on Vercel). Inlined at build time by next.config.js, so the
 *  browser knows it too. */
export function deployEnv(): string {
  return process.env.NEXT_PUBLIC_DEPLOY_ENV ?? process.env.VERCEL_ENV ?? ''
}

export function assertProjectAllowed(projectId: string | undefined, env: string = deployEnv()): void {
  if (env === 'preview' && projectId === PROD_PROJECT_ID) {
    throw new Error(
      'Refusing to use the production Firebase project on a Vercel Preview deployment. ' +
        'Set the Preview env vars to the staging project (sim-baking-house-test).',
    )
  }
}
