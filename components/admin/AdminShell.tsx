'use client'

import { useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { useAdminSession } from '@/lib/admin/AdminSession'
import { runningLowStore } from '@/lib/admin/collectionStore'

const TABS = [
  { name: 'Orders', href: '/admin', match: (p: string) => p === '/admin' || p.startsWith('/admin/orders'), icon: OrdersIcon },
  { name: 'Products', href: '/admin/products', match: (p: string) => p.startsWith('/admin/products'), icon: ProductsIcon },
  { name: 'Stock', href: '/admin/stock', match: (p: string) => p.startsWith('/admin/stock') || p.startsWith('/admin/sale'), icon: StockIcon },
  { name: 'Settings', href: '/admin/settings', match: (p: string) => p.startsWith('/admin/settings'), icon: SettingsIcon },
]

/**
 * Layout + guard for every signed-in admin page. UI redirects here are a
 * convenience — Firestore rules and the admin API routes are what actually
 * enforce access. Pages render as soon as a user is known (while the
 * admins/{uid} check is still in flight), so their own data loads run in
 * parallel with it instead of waiting behind it.
 */
export default function AdminShell({ children }: { children: ReactNode }) {
  const session = useAdminSession()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (session.phase === 'signed-out') {
      const next = pathname && pathname !== '/admin' ? `?next=${encodeURIComponent(pathname)}` : ''
      router.replace(`/admin/login${next}`)
    }
  }, [session.phase, pathname, router])

  const showContent = session.phase === 'admin' || session.phase === 'checking' || session.likelyAdmin
  const runningLow = runningLowStore.use(session.phase === 'admin').docs?.size ?? 0
  const badgeFor = (name: string) => (name === 'Stock' && runningLow > 0 ? runningLow : 0)

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-40 bg-paper/95 backdrop-blur border-b border-line">
        <nav className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6 min-w-0">
            <Link href="/admin" prefetch={false} className="font-semibold tracking-wide text-ink whitespace-nowrap">
              SBH Admin
            </Link>
            <div className="hidden md:flex items-center gap-5">
              {TABS.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  prefetch={false}
                  onPointerEnter={() => router.prefetch(t.href)}
                  className={cn(
                    'uppercase tracking-wider font-medium transition-colors',
                    t.match(pathname) ? 'text-ink' : 'text-muted hover:text-ink'
                  )}
                >
                  {t.name}
                  {badgeFor(t.name) > 0 && (
                    <>
                      <Badge count={badgeFor(t.name)} className="ml-1.5" />
                      <span className="sr-only">, {badgeFor(t.name)} running low</span>
                    </>
                  )}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 whitespace-nowrap">
            {session.role === 'admin' && (
              <Link
                href="/admin/users"
                prefetch={false}
                className={cn(pathname.startsWith('/admin/users') ? 'text-ink' : 'text-muted hover:text-ink')}
              >
                Users
              </Link>
            )}
            {/* The shop is a different root layout, so Next does a full page load here anyway. */}
            <Link href="/" prefetch={false} className="text-muted hover:text-ink">
              View shop
            </Link>
            <button onClick={() => session.signOutAdmin()} className="text-muted hover:text-clay">
              Sign out
            </button>
          </div>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-6 pb-28 md:pb-12">
        {showContent ? children : session.phase === 'error' ? <CouldNotCheck onRetry={session.retry} /> : <PageSkeleton />}
      </main>

      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-paper border-t border-line"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Admin sections"
      >
        <div className="grid grid-cols-4">
          {TABS.map((t) => {
            const active = t.match(pathname)
            const Icon = t.icon
            return (
              <Link
                key={t.href}
                href={t.href}
                // Not prefetched on load (it competed with the page's own code for
                // bandwidth); a finger touching the tab is enough of a head start.
                prefetch={false}
                onPointerDown={() => router.prefetch(t.href)}
                aria-current={active ? 'page' : undefined}
                aria-label={badgeFor(t.name) ? `${t.name}, ${badgeFor(t.name)} running low` : undefined}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-1 h-16 text-[11px] font-medium',
                  active ? 'text-ink' : 'text-muted'
                )}
              >
                <span className="relative">
                  <Icon active={active} />
                  {badgeFor(t.name) > 0 && <Badge count={badgeFor(t.name)} className="absolute -top-1.5 -right-3" />}
                </span>
                {t.name}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-40 bg-sand rounded" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-16 bg-sand/70 rounded" />
      ))}
    </div>
  )
}

/** Running-low count on the Stock tab. Decorative: the tab's aria-label says it. */
function Badge({ count, className }: { count: number; className?: string }) {
  return (
    <span
      data-testid="stock-badge"
      aria-hidden="true"
      className={cn('inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-clay text-paper text-[10px] font-semibold leading-none tabular-nums', className)}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

function CouldNotCheck({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="text-center py-16 space-y-4">
      <p className="text-sm text-ink">Could not check your admin access. Check your connection.</p>
      <button onClick={onRetry} className="bg-ink text-paper text-xs uppercase tracking-widest px-5 py-3">
        Retry
      </button>
    </div>
  )
}

function iconClass(active: boolean) {
  return cn('w-6 h-6', active ? 'stroke-ink' : 'stroke-muted')
}
function OrdersIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} className={iconClass(active)} aria-hidden="true">
      <path d="M8 6h11M8 12h11M8 18h11M4 6h.01M4 12h.01M4 18h.01" strokeLinecap="round" />
    </svg>
  )
}
function ProductsIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} className={iconClass(active)} aria-hidden="true">
      <path d="M4 7l8-4 8 4-8 4-8-4zM4 7v10l8 4 8-4V7M12 11v10" strokeLinejoin="round" />
    </svg>
  )
}
function StockIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} className={iconClass(active)} aria-hidden="true">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeLinecap="round" />
    </svg>
  )
}
function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} className={iconClass(active)} aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H3a2 2 0 110-4h.1a1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3H9a1.6 1.6 0 001-1.5V3a2 2 0 114 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8V9a1.6 1.6 0 001.5 1H21a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z" />
    </svg>
  )
}
