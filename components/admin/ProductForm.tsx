'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { doc, collection, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { uploadProductPhoto } from '@/lib/firebase/storage'
import type { Product } from '@/types/product'

interface ProductFormProps {
  productId?: string // present = editing, absent = creating
  initial?: Partial<Product>
}

export default function ProductForm({ productId, initial }: ProductFormProps) {
  const router = useRouter()
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [price, setPrice] = useState(initial?.price !== undefined ? String(initial.price) : '')
  const [category, setCategory] = useState(initial?.category ?? '')
  const [stockCount, setStockCount] = useState(
    initial?.stockCount !== undefined ? String(initial.stockCount) : ''
  )
  const [inStock, setInStock] = useState(initial?.inStock ?? true)
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const priceNum = Number(price)
    if (!name.trim()) return setError('Enter a name')
    if (!Number.isFinite(priceNum) || priceNum < 0) return setError('Enter a valid price')
    if (!category.trim()) return setError('Enter a category')

    setSaving(true)
    try {
      const ref = productId ? doc(db, 'products', productId) : doc(collection(db, 'products'))
      let finalImageUrl = imageUrl
      if (photoFile) {
        finalImageUrl = await uploadProductPhoto(photoFile, ref.id)
      }

      const stockCountNum = stockCount.trim() === '' ? null : Number(stockCount)

      await setDoc(
        ref,
        {
          name: name.trim(),
          description: description.trim(),
          price: priceNum,
          category: category.trim(),
          imageUrl: finalImageUrl || '/images/placeholder-product.jpg',
          inStock,
          // null clears tracking (matches lib/firebase/products.ts reading
          // only a genuine number as "tracking on") — never write 0 for
          // "not tracked", that would read as "0 in stock".
          ...(stockCountNum !== null && Number.isFinite(stockCountNum)
            ? { stockCount: stockCountNum }
            : { stockCount: null }),
          updatedAt: serverTimestamp(),
          ...(!productId && { createdAt: serverTimestamp(), featured: false }),
        },
        { merge: true }
      )

      router.push('/admin/products')
    } catch {
      setError('Could not save. Check your connection and try again.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-xs uppercase tracking-widest text-ink/70 mb-2">
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full bg-white border border-line py-3 px-4 text-ink text-sm focus:outline-none focus:border-ink/40"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-xs uppercase tracking-widest text-ink/70 mb-2">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full bg-white border border-line py-3 px-4 text-ink text-sm focus:outline-none focus:border-ink/40"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="block text-xs uppercase tracking-widest text-ink/70 mb-2">
            Price (RM)
          </label>
          <input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="w-full bg-white border border-line py-3 px-4 text-ink text-sm focus:outline-none focus:border-ink/40"
          />
        </div>
        <div>
          <label htmlFor="category" className="block text-xs uppercase tracking-widest text-ink/70 mb-2">
            Category
          </label>
          <input
            id="category"
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="w-full bg-white border border-line py-3 px-4 text-ink text-sm focus:outline-none focus:border-ink/40"
          />
        </div>
      </div>

      <div>
        <label htmlFor="stockCount" className="block text-xs uppercase tracking-widest text-ink/70 mb-2">
          Stock count (optional)
        </label>
        <input
          id="stockCount"
          type="number"
          min="0"
          step="1"
          value={stockCount}
          onChange={(e) => setStockCount(e.target.value)}
          placeholder="Leave empty to turn off stock tracking"
          className="w-full bg-white border border-line py-3 px-4 text-ink text-sm focus:outline-none focus:border-ink/40"
        />
        <p className="text-[11px] text-muted mt-1">Never shown to customers — internal tracking only.</p>
      </div>

      <label className="flex items-center gap-3 text-sm text-ink">
        <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} />
        In stock
      </label>

      <div>
        <label htmlFor="photo" className="block text-xs uppercase tracking-widest text-ink/70 mb-2">
          Photo
        </label>
        {imageUrl && !photoFile && (
          // eslint-disable-next-line @next/next/no-img-element -- admin form preview of an already-hosted Firebase Storage URL
          <img src={imageUrl} alt="Current product photo" className="w-24 h-24 object-cover border border-line mb-2" />
        )}
        <input
          id="photo"
          type="file"
          accept="image/*"
          onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
          className="text-sm text-ink"
        />
      </div>

      {error && <p className="text-xs text-clay">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-ink hover:bg-clay disabled:opacity-50 text-paper py-4 font-body font-medium text-xs uppercase tracking-[0.2em] transition-colors"
      >
        {saving ? 'Saving…' : 'Save product'}
      </button>
    </form>
  )
}
