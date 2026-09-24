'use client'

import ProductForm from '@/components/admin/ProductForm'

export default function NewProductPage() {
  return (
    <div>
      <h1 className="font-heading text-ink text-3xl mb-6">Add product</h1>
      <ProductForm />
    </div>
  )
}
