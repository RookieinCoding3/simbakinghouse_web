'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { uploadProductPhoto } from '@/lib/firebase/storage'
import { adminFetch, AdminApiError } from '@/lib/admin/api'
import { useAdminSession } from '@/lib/admin/AdminSession'
import { useAdminProducts } from '@/lib/admin/productsStore'
import { inventoryStore } from '@/lib/admin/collectionStore'
import { recordReads } from '@/lib/admin/readMetrics'
import { newOpId } from '@/lib/admin/stockView'
import { readPublicSellUnits, readStockConfig, normalizeSellUnit, type Channel, type SellUnit } from '@/lib/inventory/catalog'
import { BASE_UNITS, formatQty, milliToString, parseQtyToMilli } from '@/lib/inventory/units'
import { formatSen } from '@/lib/money'
import PriceKeypad from './PriceKeypad'

// The product editor. Everything is saved through /api/admin/products (one
// transaction, audited); the browser never writes the product doc. Stock
// quantities are not edited here: switching stock tracking on needs a count
// and happens on the product's Stock page, which this form links to.

interface ProductFormProps {
  productId?: string // present = editing, absent = creating
  /** The raw product doc, when editing. */
  initial?: Record<string, unknown>
}

interface UnitDraft {
  key: string
  id?: string
  label: string
  uses: string // base units, as typed ("0.5")
  priceSen: number | null
  channel: Channel
}

const CHANNELS: { key: Channel; label: string }[] = [
  { key: 'both', label: 'Shop and online' },
  { key: 'online', label: 'Online only' },
  { key: 'wholesale', label: 'Wholesale, in the shop only' },
]

const ADD_NEW = '__add_new__'
const inputCls = 'w-full bg-white border border-line py-3 px-4 text-ink text-base focus:outline-none focus:border-ink/40'
const labelCls = 'block text-xs uppercase tracking-widest text-ink/70 mb-2'

function str(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

let keySeq = 0
function toDraft(u: SellUnit): UnitDraft {
  return { key: `k${keySeq++}`, id: u.id, label: u.label, uses: milliToString(u.factorMilli), priceSen: u.priceSen, channel: u.channel }
}

function randomId(): string {
  return newOpId().slice(0, 20)
}

export default function ProductForm({ productId, initial }: ProductFormProps) {
  const router = useRouter()
  const { user } = useAdminSession()
  const { products } = useAdminProducts(!!user)
  const inventory = inventoryStore.use(!!user && !!productId)
  const config = readStockConfig(initial)
  const managed = config.managed

  const [id] = useState(() => productId ?? randomId())
  const [name, setName] = useState(str(initial?.name))
  const [description, setDescription] = useState(str(initial?.description))
  const [category, setCategory] = useState(str(initial?.category))
  const [newCatName, setNewCatName] = useState('')
  const [newCatZh, setNewCatZh] = useState('')
  const [addingCat, setAddingCat] = useState(false)
  const [catBusy, setCatBusy] = useState(false)
  const [extraCats, setExtraCats] = useState<string[]>([])
  const [inStock, setInStock] = useState(initial?.inStock !== false)
  const [baseUnit, setBaseUnit] = useState(config.baseUnit)
  const [lowLevel, setLowLevel] = useState(milliToString(config.lowStockThresholdMilli))
  const [trackExpiry, setTrackExpiry] = useState(config.trackExpiry)
  const [barcodes, setBarcodes] = useState(Array.isArray(initial?.barcodes) ? (initial!.barcodes as string[]).join(', ') : '')
  const [units, setUnits] = useState<UnitDraft[]>(() =>
    initial ? readPublicSellUnits(initial).map(toDraft) : [{ key: `k${keySeq++}`, label: '1 pc', uses: '1', priceSen: null, channel: 'both' }]
  )
  const [wholesaleLoaded, setWholesaleLoaded] = useState(!productId)
  const [openPrice, setOpenPrice] = useState<string | null>(null)
  const [imageUrl] = useState(str(initial?.imageUrl))
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Wholesale-only units live in productPrivate/{id}, read through the API.
  useEffect(() => {
    if (!productId || !user) return
    let cancelled = false
    adminFetch<{ wholesaleUnits: unknown[] }>(`/api/admin/products/${encodeURIComponent(productId)}`)
      .then((r) => {
        if (cancelled) return
        const extra = (r.wholesaleUnits ?? []).map(normalizeSellUnit).filter(Boolean) as SellUnit[]
        if (extra.length) setUnits((cur) => [...cur, ...extra.map(toDraft)])
        setWholesaleLoaded(true)
      })
      .catch(() => !cancelled && setError('Could not load the wholesale sizes. Reload before saving.'))
    return () => {
      cancelled = true
    }
  }, [productId, user])

  const [catDocs, setCatDocs] = useState<string[]>([])
  useEffect(() => {
    if (!user) return
    getDocs(collection(db, 'categories'))
      .then((snap) => {
        recordReads(snap.size)
        setCatDocs(snap.docs.map((d) => str(d.data().name)).filter(Boolean))
      })
      .catch(() => {})
  }, [user])

  const categories = useMemo(() => {
    const seen = new Map<string, string>()
    for (const c of [...catDocs, ...(products ?? []).map((p) => p.category), ...extraCats, category]) {
      const k = c.trim().toLowerCase()
      if (k && !seen.has(k)) seen.set(k, c.trim())
    }
    return [...seen.values()].sort((a, b) => a.localeCompare(b))
  }, [catDocs, products, extraCats, category])

  const inv = productId ? inventory.docs?.get(productId) : undefined

  const updateUnit = (key: string, patch: Partial<UnitDraft>) => setUnits((cur) => cur.map((u) => (u.key === key ? { ...u, ...patch } : u)))

  const addCategory = async () => {
    setError(null)
    setCatBusy(true)
    try {
      const r = await adminFetch<{ name: string }>('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newCatName, nameZh: newCatZh }),
      })
      setExtraCats((c) => [...c, r.name])
      setCategory(r.name)
      setAddingCat(false)
      setNewCatName('')
      setNewCatZh('')
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : 'Could not add the category.')
    } finally {
      setCatBusy(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name.trim()) return setError('Enter a name.')
    if (!category.trim() || category === ADD_NEW) return setError('Choose a category.')
    const low = parseQtyToMilli(lowLevel || '0')
    if (low === null) return setError('Enter a low-stock level (0 or more).')
    const sellUnits = []
    for (const u of units) {
      const factorMilli = parseQtyToMilli(u.uses)
      if (!u.label.trim()) return setError('Every size needs a name, like "1 kg" or "25 kg bag".')
      if (factorMilli === null || factorMilli <= 0) return setError(`"${u.label}": enter how many ${baseUnit} it uses (more than 0).`)
      sellUnits.push({ id: u.id, label: u.label.trim(), factorMilli, priceSen: u.priceSen, channel: u.channel })
    }
    if (!wholesaleLoaded) return setError('Still loading the wholesale sizes. Try again in a moment.')

    setSaving(true)
    try {
      const finalImageUrl = photoFile ? await uploadProductPhoto(photoFile, id) : imageUrl
      const body = {
        id,
        name,
        description,
        category,
        imageUrl: finalImageUrl,
        inStock,
        // Not edited here; sent back unchanged so saving never clears them.
        featured: initial?.featured === true,
        mentorNote: str(initial?.mentorNote),
        baseUnit,
        lowStockThresholdMilli: low,
        trackExpiry,
        barcodes: barcodes.split(/[\s,]+/).filter(Boolean),
        sellUnits,
      }
      await adminFetch(productId ? `/api/admin/products/${encodeURIComponent(productId)}` : '/api/admin/products', {
        method: productId ? 'PUT' : 'POST',
        body: JSON.stringify(body),
      })
      router.push('/admin/products')
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'Could not save. Check your connection and try again.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      <section className="space-y-5">
        <div>
          <label htmlFor="name" className={labelCls}>Name</label>
          <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </div>

        <div>
          <label htmlFor="category" className={labelCls}>Category</label>
          <select
            id="category"
            value={addingCat ? ADD_NEW : category}
            onChange={(e) => {
              if (e.target.value === ADD_NEW) setAddingCat(true)
              else {
                setAddingCat(false)
                setCategory(e.target.value)
              }
            }}
            className={inputCls}
          >
            <option value="">Choose a category</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
            <option value={ADD_NEW}>+ Add new category</option>
          </select>
          {addingCat && (
            <div className="mt-3 border border-line p-3 space-y-3 bg-white" data-testid="new-category">
              <div>
                <label htmlFor="new-cat" className={labelCls}>New category (English)</label>
                <input id="new-cat" type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="new-cat-zh" className={labelCls}>Chinese name (optional)</label>
                <input id="new-cat-zh" type="text" value={newCatZh} onChange={(e) => setNewCatZh(e.target.value)} className={inputCls} />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={addCategory} disabled={catBusy || !newCatName.trim()} className="flex-1 bg-ink text-paper py-3 text-xs uppercase tracking-widest disabled:opacity-40">
                  {catBusy ? 'Adding…' : 'Add category'}
                </button>
                <button type="button" onClick={() => setAddingCat(false)} className="px-4 border border-line text-xs uppercase tracking-widest">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="description" className={labelCls}>Description</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={`${inputCls} resize-none`} />
        </div>

        <div>
          <label htmlFor="photo" className={labelCls}>Photo</label>
          {imageUrl && !photoFile && (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview of an existing Storage URL
            <img src={imageUrl} alt="" className="w-24 h-24 object-cover border border-line mb-3" />
          )}
          <input id="photo" type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} className="block w-full text-sm text-ink/70" />
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="sizes-title">
        <div>
          <h2 id="sizes-title" className="text-sm font-semibold text-ink">Sizes and prices</h2>
          <p className="text-xs text-muted mt-1">
            How this product is sold. Wholesale sizes and their prices are never shown online. Leave the price as &quot;Ask for price&quot; to quote it yourself (the order shows
            &quot;price to confirm&quot;).
          </p>
        </div>

        <div>
          <label htmlFor="base-unit" className={labelCls}>Counted in</label>
          <select id="base-unit" value={baseUnit} onChange={(e) => setBaseUnit(e.target.value)} disabled={managed} className={`${inputCls} disabled:bg-sand`}>
            {BASE_UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
          {managed && <p className="text-xs text-muted mt-1">Locked while stock is managed (the stock numbers are in {baseUnit}).</p>}
        </div>

        <ul className="space-y-3" data-testid="sell-units">
          {units.map((u, i) => (
            <li key={u.key} className="border border-line bg-white p-3 space-y-3" data-testid="sell-unit">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label htmlFor={`u-label-${u.key}`} className={labelCls}>Size name</label>
                  <input id={`u-label-${u.key}`} type="text" value={u.label} placeholder="1 kg" onChange={(e) => updateUnit(u.key, { label: e.target.value })} className={inputCls} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label htmlFor={`u-uses-${u.key}`} className={labelCls}>Uses ({baseUnit})</label>
                  <input id={`u-uses-${u.key}`} type="text" inputMode="decimal" value={u.uses} onChange={(e) => updateUnit(u.key, { uses: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div>
                <label htmlFor={`u-channel-${u.key}`} className={labelCls}>Sold</label>
                <select id={`u-channel-${u.key}`} value={u.channel} onChange={(e) => updateUnit(u.key, { channel: e.target.value as Channel })} className={inputCls}>
                  {CHANNELS.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <span className={labelCls}>Price</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOpenPrice(openPrice === u.key ? null : u.key)}
                    aria-expanded={openPrice === u.key}
                    data-testid="price-button"
                    className="flex-1 text-left border border-line py-3 px-4 text-base tabular-nums"
                  >
                    {formatSen(u.priceSen)}
                  </button>
                  <label className="flex items-center gap-2 text-sm px-2">
                    <input
                      type="checkbox"
                      checked={u.priceSen === null}
                      onChange={(e) => {
                        updateUnit(u.key, { priceSen: e.target.checked ? null : 0 })
                        setOpenPrice(e.target.checked ? null : u.key)
                      }}
                    />
                    Ask for price
                  </label>
                </div>
                {openPrice === u.key && (
                  <div className="mt-3">
                    <PriceKeypad id={`u-price-${u.key}`} label={`Price for ${u.label || 'this size'}`} valueSen={u.priceSen} onChange={(sen) => updateUnit(u.key, { priceSen: sen })} autoFocus />
                    <button type="button" onClick={() => setOpenPrice(null)} className="mt-2 w-full border border-ink py-2.5 text-xs uppercase tracking-widest">
                      Done
                    </button>
                  </div>
                )}
              </div>
              {units.length > 1 && (
                <button type="button" onClick={() => setUnits((cur) => cur.filter((x) => x.key !== u.key))} className="text-xs text-clay underline">
                  Remove this size
                </button>
              )}
              {i === 0 && units.length > 1 && <p className="text-xs text-muted">The first size is the one old carts and the product card use.</p>}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setUnits((cur) => [...cur, { key: `k${keySeq++}`, label: '', uses: '1', priceSen: null, channel: 'both' }])}
          className="w-full border border-dashed border-ink/40 py-3 text-xs uppercase tracking-widest"
        >
          + Add a size
        </button>
      </section>

      <section className="space-y-4" aria-labelledby="stock-title">
        <h2 id="stock-title" className="text-sm font-semibold text-ink">Stock</h2>
        {managed ? (
          <div className="bg-sand rounded px-3 py-3 text-sm space-y-1" data-testid="stock-managed">
            <p>Stock is managed here.</p>
            {inv && (
              <p className="text-ink/80">
                On the shelf {formatQty(inv.onHandMilli, baseUnit)} · held for orders {formatQty(inv.reservedMilli, baseUnit)} · available{' '}
                {formatQty(inv.onHandMilli - inv.reservedMilli, baseUnit)}
              </p>
            )}
            <Link href={`/admin/stock/${id}`} className="text-xs underline">Adjust stock or see history</Link>
          </div>
        ) : (
          <div className="space-y-3" data-testid="stock-unmanaged">
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} />
              In stock (shown to customers)
            </label>
            <p className="text-xs text-muted">
              Stock numbers are not tracked for this product.{' '}
              {productId ? (
                <Link href={`/admin/stock/${id}`} className="underline">Switch on stock tracking</Link>
              ) : (
                'After saving, you can switch on stock tracking from its Stock page (it needs a count first).'
              )}
            </p>
          </div>
        )}
        <div>
          <label htmlFor="low-level" className={labelCls}>Running low at ({baseUnit})</label>
          <input id="low-level" type="text" inputMode="decimal" value={lowLevel} onChange={(e) => setLowLevel(e.target.value)} className={inputCls} />
          <p className="text-xs text-muted mt-1">Customers see &quot;Low stock&quot; at or below this, once stock is managed.</p>
        </div>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" checked={trackExpiry} onChange={(e) => setTrackExpiry(e.target.checked)} />
          Track expiry dates (sell the soonest to expire first)
        </label>
        <div>
          <label htmlFor="barcodes" className={labelCls}>Barcodes (optional, comma separated)</label>
          <input id="barcodes" type="text" value={barcodes} onChange={(e) => setBarcodes(e.target.value)} className={inputCls} />
        </div>
      </section>

      {error && <p role="alert" className="text-sm text-clay">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-ink hover:bg-clay disabled:opacity-50 text-paper py-4 font-medium text-xs uppercase tracking-[0.2em] transition-colors"
      >
        {saving ? 'Saving…' : 'Save product'}
      </button>
    </form>
  )
}

