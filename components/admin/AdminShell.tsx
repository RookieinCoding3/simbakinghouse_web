'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { useAdminSession } from '@/lib/admin/AdminSession'
import { adminFetch } from '@/lib/admin/api'
import { fetchShopSettings } from '@/lib/firebase/settings'
import { storeStatus } from '@/lib/admin/storeStatus'

type BadgeKey = 'orders' | 'stock' | 'drafts' | 'promos'
type Badges = Record<BadgeKey, number>

const NAV: { name: string; href: string; icon: string; match: (p: string) => boolean; badge?: BadgeKey; tone?: 'red' | 'amber' | 'neutral' }[] = [
  { name: 'Home', href: '/admin', icon: '🏠', match: (p) => p === '/admin' },
  { name: 'Orders', href: '/admin/orders', icon: '📦', match: (p) => p.startsWith('/admin/orders'), badge: 'orders', tone: 'red' },
  { name: 'Stock & Batches', href: '/admin/stock', icon: '📊', match: (p) => p.startsWith('/admin/stock'), badge: 'stock', tone: 'amber' },
  { name: 'Products', href: '/admin/products', icon: '🏷️', match: (p) => p.startsWith('/admin/products') || p.startsWith('/admin/drafts'), badge: 'drafts', tone: 'amber' },
  { name: 'Sale Events', href: '/admin/promos', icon: '🎉', match: (p) => p.startsWith('/admin/promos'), badge: 'promos', tone: 'neutral' },
  { name: 'Settings', href: '/admin/settings', icon: '⚙️', match: (p) => p.startsWith('/admin/settings') },
]

const BADGE_TEXT: Record<BadgeKey, string> = { orders: 'to act on', stock: 'stock alerts', drafts: 'drafts waiting', promos: 'live' }

/**
 * Layout + guard for every signed-in admin page: an iPad-style left rail
 * (220 px, big touch targets, live counts) on tablets and desktops, a
 * slide-in menu on phones. UI redirects are a convenience — Firestore rules
 * and the admin API routes are what actually enforce access.
 */
export default function AdminShell({ children }: { children: ReactNode }) {
  const session = useAdminSession()
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [badges, setBadges] = useState<Badges | null>(null)
  const [status, setStatus] = useState<{ open: boolean; label: string } | null>(null)

  useEffect(() => {
    if (session.phase === 'signed-out') {
      const next = pathname && pathname !== '/admin' ? `?next=${encodeURIComponent(pathname)}` : ''
      router.replace(`/admin/login${next}`)
    }
  }, [session.phase, pathname, router])

  useEffect(() => setMenuOpen(false), [pathname])

  const loadBadges = useCallback(() => {
    adminFetch<Badges>('/api/admin/badges').then(setBadges).catch(() => {})
  }, [])
  useEffect(() => {
    if (!session.user) return
    loadBadges()
    const t = setInterval(loadBadges, 60_000)
    const onFocus = () => loadBadges()
    window.addEventListener('focus', onFocus)
    window.addEventListener('sbh-admin-changed', onFocus)
    return () => {
      clearInterval(t)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('sbh-admin-changed', onFocus)
    }
  }, [session.user, loadBadges])

  useEffect(() => {
    const update = () => fetchShopSettings().then((s) => setStatus(storeStatus(s.shopOpensAt, s.shopClosesAt)))
    update()
    const t = setInterval(update, 5 * 60_000)
    return () => clearInterval(t)
  }, [])

  const showContent = session.phase === 'admin' || session.phase === 'checking' || session.likelyAdmin
  const nav = session.role === 'admin' ? [...NAV, { name: 'Users', href: '/admin/users', icon: '👥', match: (p: string) => p.startsWith('/admin/users') }] : NAV

  const rail = (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-5 pb-4 border-b border-line">
        <Link href="/admin" prefetch={false} className="block font-semibold tracking-wide text-ink text-base">
          SBH Admin
        </Link>
        {status && (
          <span
            className={cn('mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium', status.open ? 'bg-[#E7F3EC] text-[#1F5E3B]' : 'bg-sand text-ink/70')}
            data-testid="store-status"
          >
            <span className={cn('w-1.5 h-1.5 rounded-full', status.open ? 'bg-[#1F7A4D]' : 'bg-ink/40')} aria-hidden="true" />
            {status.label}
          </span>
        )}
      </div>
      <nav aria-label="Admin sections" className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {nav.map((item) => {
          const active = item.match(pathname)
          const count = 'badge' in item && item.badge ? (badges?.[item.badge] ?? 0) : 0
          const tone = 'tone' in item ? item.tone : undefined
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              onPointerDown={() => router.prefetch(item.href)}
              aria-current={active ? 'page' : undefined}
              aria-label={count && 'badge' in item && item.badge ? `${item.name}, ${count} ${BADGE_TEXT[item.badge]}` : undefined}
              data-testid={`nav-${item.href.split('/').pop() || 'home'}`}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 min-h-[48px] text-sm font-medium transition-colors',
                active ? 'bg-ink text-paper' : 'text-ink hover:bg-sand',
              )}
            >
              <span aria-hidden="true" className="text-lg w-6 text-center">{item.icon}</span>
              <span className="flex-1 truncate">{item.name}</span>
              {count > 0 && (
                <span
                  aria-hidden="true"
                  data-testid={`badge-${'badge' in item ? item.badge : ''}`}
                  className={cn(
                    'min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-semibold inline-flex items-center justify-center tabular-nums',
                    tone === 'red' ? 'bg-[#B42318] text-white' : tone === 'amber' ? 'bg-[#F5B544] text-ink' : 'bg-sand text-ink',
                  )}
                >
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-line px-2 py-3 space-y-1" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-3 min-h-[48px] text-sm text-ink hover:bg-sand">
          <span aria-hidden="true" className="w-6 text-center">↗</span>
          View Live Shop
        </a>
        <button onClick={() => session.signOutAdmin()} className="w-full flex items-center gap-3 rounded-xl px-3 min-h-[48px] text-sm text-clay hover:bg-sand text-left">
          <span aria-hidden="true" className="w-6 text-center">⎋</span>
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-paper">
      {/* Tablet / desktop: fixed left rail. */}
      <aside className="hidden md:block fixed inset-y-0 left-0 w-[220px] bg-white border-r border-line z-40" data-testid="admin-sidebar">
        {rail}
      </aside>

      {/* Phone: top bar + slide-in menu. */}
      <header className="md:hidden sticky top-0 z-40 bg-paper/95 backdrop-blur border-b border-line h-14 flex items-center justify-between px-4">
        <button onClick={() => setMenuOpen(true)} aria-label="Open admin menu" aria-expanded={menuOpen} className="-ml-2 w-11 h-11 flex items-center justify-center text-ink relative">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
          {(badges?.orders ?? 0) > 0 && <span className="absolute top-1.5 right-1 w-2.5 h-2.5 rounded-full bg-[#B42318]" aria-hidden="true" />}
        </button>
        <Link href="/admin" prefetch={false} className="font-semibold tracking-wide text-ink text-sm">
          SBH Admin
        </Link>
        <div className="flex items-center gap-3 text-xs">
          {session.role === 'admin' && (
            <Link href="/admin/users" prefetch={false} className={cn(pathname.startsWith('/admin/users') ? 'text-ink' : 'text-muted')}>
              Users
            </Link>
          )}
          <button onClick={() => session.signOutAdmin()} className="text-muted hover:text-clay min-h-[44px]">
            Sign out
          </button>
        </div>
      </header>
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[260px] max-w-[85%] bg-white shadow-2xl" role="dialog" aria-label="Admin menu">
            {rail}
          </div>
        </div>
      )}

      {/* Phone: bottom tabs for the sections used every day (the menu has all). */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-paper border-t border-line"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Admin sections"
      >
        <div className="grid grid-cols-5">
          {NAV.filter((n) => n.href !== '/admin/promos').map((item) => {
            const active = item.match(pathname)
            const count = item.badge ? (badges?.[item.badge] ?? 0) : 0
            const short = item.name === 'Stock & Batches' ? 'Stock' : item.name
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onPointerDown={() => router.prefetch(item.href)}
                aria-current={active ? 'page' : undefined}
                aria-label={count && item.badge ? `${short}, ${count} ${BADGE_TEXT[item.badge]}` : short}
                className={cn('relative flex flex-col items-center justify-center gap-0.5 h-16 text-[11px] font-medium', active ? 'text-ink' : 'text-muted')}
              >
                <span aria-hidden="true" className="text-lg leading-none relative">
                  {item.icon}
                  {count > 0 && (
                    <span className={cn('absolute -top-1.5 -right-3 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-semibold inline-flex items-center justify-center', item.tone === 'red' ? 'bg-[#B42318] text-white' : 'bg-[#F5B544] text-ink')}>
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </span>
                {short}
              </Link>
            )
          })}
        </div>
      </nav>

      <main className="md:ml-[220px] px-4 md:px-8 pt-6 pb-28 md:pb-16">
        <div className="max-w-6xl mx-auto">
          {showContent ? children : session.phase === 'error' ? <CouldNotCheck onRetry={session.retry} /> : <PageSkeleton />}
        </div>
      </main>
    </div>
  )
}

/** Tell the shell something changed (order moved, stock received): refresh counts. */
export function notifyAdminChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('sbh-admin-changed'))
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
