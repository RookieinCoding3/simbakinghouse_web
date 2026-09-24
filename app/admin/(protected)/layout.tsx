'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import AdminGuard from '@/components/admin/AdminGuard'
import { adminSignOut } from '@/lib/firebase/auth'

const NAV_ITEMS = [
  { name: 'Orders', path: '/admin' },
  { name: 'Products', path: '/admin/products' },
  { name: 'Settings', path: '/admin/settings' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <AdminGuard>
      <div className="min-h-screen bg-paper">
        <header className="sticky top-0 z-40 bg-paper border-b border-line">
          <nav className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between text-xs tracking-wider">
            <div className="flex items-center gap-5">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    'uppercase font-medium transition-colors',
                    pathname === item.path ? 'text-ink' : 'text-muted hover:text-ink'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            <button
              onClick={() => adminSignOut()}
              className="uppercase text-muted hover:text-clay transition-colors"
            >
              Sign out
            </button>
          </nav>
        </header>
        <div className="max-w-3xl mx-auto px-4 py-8">{children}</div>
      </div>
    </AdminGuard>
  )
}
