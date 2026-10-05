'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { cn } from '@/lib/utils/cn'
import { useAdminSession } from '@/lib/admin/AdminSession'
import { useAdminProducts, retryProducts } from '@/lib/admin/productsStore'

export default function AdminProductsPage() {
  const { user } = useAdminSession()
  const { products, status, stale } = useAdminProducts(!!user)
  const [search, setSearch] = useState('')
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!products) return []
    if (!q) return products
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
  }, [products, search])

  const toggleStock = async (id: string, inStock: boolean) => {
    setTogglingId(id)
    try {
      await updateDoc(doc(db, 'products', id), { inStock: !inStock })
    } catch {
      // The live listener keeps the list in sync with reality either way.
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="font-heading text-ink text-2xl md:text-3xl">Products</h1>
        <Link
          href="/admin/products/new"
          className="bg-ink hover:bg-clay text-paper text-xs uppercase tracking-widest font-medium px-4 py-2.5 transition-colors"
        >
          Add product
        </Link>
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={products ? `Search ${products.length} products` : 'Search products'}
        className="w-full bg-white border border-line py-3 px-4 text-base mb-4 focus:outline-none focus:border-ink/40"
      />

      {status === 'error' && !products && (
        <div role="alert" className="py-12 text-center space-y-4">
          <p className="text-sm text-ink">Could not load products.</p>
          <button onClick={retryProducts} className="bg-ink text-paper text-xs uppercase tracking-widest px-5 py-3">
            Retry
          </button>
        </div>
      )}

      {!products && status !== 'error' && (
        <div className="space-y-3 animate-pulse" aria-busy="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 bg-sand/70 rounded" />
          ))}
        </div>
      )}

      {products && (
        <>
          {stale && <p className="text-[11px] text-muted mb-2">Refreshing…</p>}
          {filtered.length === 0 && <p className="text-sm text-muted py-6">No products match.</p>}
          <ul className="divide-y divide-line border-y border-line">
            {filtered.map((product) => (
              <li key={product.id} className="flex items-center gap-3 py-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail, loaded straight from Storage, not via Vercel */}
                <img
                  src={product.imageUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-12 h-12 object-cover border border-line flex-shrink-0 bg-sand"
                />
                <Link href={`/admin/products/${product.id}`} prefetch={false} className="flex-1 min-w-0">
                  <p className="text-sm text-ink truncate">{product.name}</p>
                  <p className="text-xs text-muted truncate">
                    {product.price !== null ? `RM ${product.price.toFixed(2)}` : 'Ask for price'}
                    {product.category && ` · ${product.category}`}
                  </p>
                </Link>
                <button
                  onClick={() => toggleStock(product.id, product.inStock)}
                  disabled={togglingId === product.id || stale}
                  className={cn(
                    'text-[10px] uppercase tracking-widest font-medium px-3 py-2.5 flex-shrink-0 transition-colors disabled:opacity-50',
                    product.inStock ? 'bg-sand text-ink' : 'bg-clay/10 text-clay'
                  )}
                >
                  {product.inStock ? 'In stock' : 'Out of stock'}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
