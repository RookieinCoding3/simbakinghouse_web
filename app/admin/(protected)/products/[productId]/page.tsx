'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import ProductForm from '@/components/admin/ProductForm'
import type { Product } from '@/types/product'

export default function EditProductPage() {
  const params = useParams<{ productId: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'products', params.productId),
      (snap) => {
        if (!snap.exists()) {
          setNotFound(true)
          return
        }
        setProduct({ id: snap.id, ...snap.data() } as Product)
      },
      () => setNotFound(true)
    )
    return unsubscribe
  }, [params.productId])

  if (notFound) return <p className="text-sm text-muted">Product not found.</p>
  if (!product) return <p className="text-sm text-muted">Loading…</p>

  return (
    <div>
      <h1 className="font-heading text-ink text-3xl mb-6">Edit product</h1>
      <ProductForm productId={product.id} initial={product} />
    </div>
  )
}
