'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { cn } from '@/lib/utils/cn'
import type { Product } from '@/types/product'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('name', 'asc'))
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product))
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsubscribe
  }, [])

  const toggleStock = async (product: Product) => {
    setTogglingId(product.id)
    try {
      await updateDoc(doc(db, 'products', product.id), { inStock: !product.inStock })
    } catch {
      // The optimistic-free UI just won't reflect the change; onSnapshot
      // keeps this in sync with reality either way.
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-ink text-3xl">Products</h1>
        <Link
          href="/admin/products/new"
          className="bg-ink hover:bg-clay text-paper text-xs uppercase tracking-widest font-medium px-4 py-2 transition-colors"
        >
          Add product
        </Link>
      </div>

      {loading && <p className="text-sm text-muted">Loading…</p>}

      <div className="divide-y divide-line border-t border-b border-line">
        {products.map((product) => (
          <div key={product.id} className="flex items-center gap-3 py-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- small admin-list thumbnail, not worth next/image config here */}
            <img
              src={product.imageUrl || '/images/placeholder-product.jpg'}
              alt={product.name}
              className="w-12 h-12 object-cover border border-line flex-shrink-0"
            />
            <Link href={`/admin/products/${product.id}`} className="flex-1 min-w-0">
              <p className="text-sm text-ink truncate">{product.name}</p>
              <p className="text-xs text-muted">
                {product.price !== undefined ? `RM ${product.price.toFixed(2)}` : 'Ask for price'} · {product.category}
              </p>
            </Link>
            <button
              onClick={() => toggleStock(product)}
              disabled={togglingId === product.id}
              className={cn(
                'text-[10px] uppercase tracking-widest font-medium px-3 py-2 flex-shrink-0 transition-colors disabled:opacity-50',
                product.inStock ? 'bg-sand text-ink' : 'bg-clay/10 text-clay'
              )}
            >
              {product.inStock ? 'In stock' : 'Out of stock'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
