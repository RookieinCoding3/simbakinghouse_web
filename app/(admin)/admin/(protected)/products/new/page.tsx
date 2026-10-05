'use client'

import dynamic from 'next/dynamic'
import { PageSkeleton } from '@/components/admin/AdminShell'

const ProductForm = dynamic(() => import('@/components/admin/ProductForm'), { loading: () => <PageSkeleton /> })

export default function NewProductPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-ink text-2xl md:text-3xl mb-6">Add product</h1>
      <ProductForm />
    </div>
  )
}
