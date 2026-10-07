'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAdminSession } from '@/lib/admin/AdminSession'
import { recordReads } from '@/lib/admin/readMetrics'
import { PageSkeleton } from '@/components/admin/AdminShell'

const ProductForm = dynamic(() => import('@/components/admin/ProductForm'), { loading: () => <PageSkeleton /> })

export default function EditProductPage() {
  const params = useParams<{ productId: string }>()
  const { user } = useAdminSession()
  const [product, setProduct] = useState<{ id: string; data: Record<string, unknown> } | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!user) return
    return onSnapshot(
      doc(db, 'products', params.productId),
      (snap) => {
        recordReads(1)
        if (!snap.exists()) {
          setState('missing')
          return
        }
        // Read once: a live update mid-edit would not reset the form anyway.
        setProduct((cur) => cur ?? { id: snap.id, data: snap.data() })
        setState('ready')
      },
      () => setState('error')
    )
  }, [params.productId, user, attempt])

  if (state === 'missing') return <p className="text-sm text-muted">Product not found.</p>
  if (state === 'error') {
    return (
      <div role="alert" className="py-12 text-center space-y-4">
        <p className="text-sm text-ink">Could not load this product.</p>
        <button onClick={() => setAttempt((a) => a + 1)} className="bg-ink text-paper text-xs uppercase tracking-widest px-5 py-3">
          Retry
        </button>
      </div>
    )
  }
  if (!product) return <PageSkeleton />

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-ink text-2xl md:text-3xl mb-6">Edit product</h1>
      <ProductForm productId={product.id} initial={product.data} />
    </div>
  )
}
