'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAdminSession } from '@/lib/admin/AdminSession'
import { adminFetch, AdminApiError } from '@/lib/admin/api'
import { PageSkeleton } from '@/components/admin/AdminShell'
import { parseRMToSen, senToRMString } from '@/lib/money'

// "Complete details" for products quick-added on the shop iPad (status
// 'draft'): the same queue as the iPad's screen, for a normal browser.

interface Draft {
  id: string
  code: string
  imageUrl: string | null
  sellPriceSen: number | null
  categoryId: string | null
  unitLabel: string
  kind: string
  repackSourceProductId: string | null
  scannedAt: number
}
interface Category {
  id: string
  name: string
  nameZh: string
}
interface Bulk {
  id: string
  code: string
  name: string
}

const UNITS = ['pack', 'bag', 'kg', 'pc', 'box']
const input = 'w-full bg-white border border-line py-3 px-4 text-ink text-sm focus:outline-none focus:border-ink/40'
const label = 'block text-xs uppercase tracking-widest text-ink/70 mb-2'

export default function DraftsPage() {
  const { user } = useAdminSession()
  const [data, setData] = useState<{ drafts: Draft[]; categories: Category[]; bulks: Bulk[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const load = useCallback(() => {
    adminFetch<{ drafts: Draft[]; categories: Category[]; bulks: Bulk[] }>('/api/admin/drafts')
      .then((d) => {
        setData(d)
        setError(null)
      })
      .catch((e: AdminApiError) => setError(e.message))
  }, [])
  useEffect(() => {
    if (user) load()
  }, [user, load])

  if (error) return <p className="text-sm text-clay">{error}</p>
  if (!data) return <PageSkeleton />
  const drafts = data.drafts
  const selected = drafts.find((d) => d.id === selectedId) ?? drafts[0]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <h1 className="font-heading text-ink text-2xl md:text-3xl">Complete details</h1>
          <span className="text-sm text-muted" data-testid="draft-count">
            {drafts.length} waiting
          </span>
        </div>
        <Link href="/admin/products" className="text-xs uppercase tracking-widest text-clay">
          Products
        </Link>
      </div>
      <p className="text-sm text-muted">
        Products scanned from the shelf on the iPad. They are hidden from the shop until their details are saved here (or
        on the iPad).
      </p>
      {drafts.length === 0 ? (
        <p className="text-sm text-ink" data-testid="no-drafts">
          Nothing waiting. Every product has its details.
        </p>
      ) : (
        <div className="grid md:grid-cols-[280px_1fr] gap-6">
          <ul className="border border-line divide-y divide-line bg-white max-h-[70vh] overflow-y-auto" aria-label="Drafts">
            {drafts.map((d) => (
              <li key={d.id}>
                <button
                  onClick={() => setSelectedId(d.id)}
                  className={`w-full flex items-center gap-3 p-3 text-left ${d.id === selected?.id ? 'bg-sand' : ''}`}
                >
                  {d.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- Storage download URL
                    <img src={d.imageUrl} alt="" className="w-12 h-12 object-cover" />
                  ) : (
                    <span className="w-12 h-12 bg-sand inline-block" />
                  )}
                  <span className="min-w-0">
                    <span className="block text-sm text-ink font-medium truncate">{d.code}</span>
                    {d.sellPriceSen !== null && <span className="block text-xs text-muted">RM {senToRMString(d.sellPriceSen)}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {selected && (
            <DraftForm
              key={selected.id}
              draft={selected}
              categories={data.categories}
              bulks={data.bulks.filter((b) => b.id !== selected.id)}
              onSaved={() => {
                setData({ ...data, drafts: drafts.filter((d) => d.id !== selected.id) })
                setSelectedId(null)
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}

function DraftForm({ draft, categories, bulks, onSaved }: { draft: Draft; categories: Category[]; bulks: Bulk[]; onSaved: () => void }) {
  const [name, setName] = useState('')
  const [nameZh, setNameZh] = useState('')
  const [categoryId, setCategoryId] = useState(draft.categoryId ?? '')
  const [unitLabel, setUnit] = useState(draft.unitLabel || 'pack')
  const [kind, setKind] = useState(draft.kind || 'standard')
  const [sourceId, setSourceId] = useState(draft.repackSourceProductId ?? '')
  const [yieldText, setYield] = useState('')
  const [price, setPrice] = useState(draft.sellPriceSen === null ? '' : senToRMString(draft.sellPriceSen))
  const [cost, setCost] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function save() {
    setMessage(null)
    const sellPriceSen = price.trim() ? parseRMToSen(price) : null
    const costSen = cost.trim() ? parseRMToSen(cost) : null
    if (price.trim() && sellPriceSen === null) return setMessage('Enter the price like 12.50')
    if (cost.trim() && costSen === null) return setMessage('Enter the cost like 12.50')
    setSaving(true)
    try {
      await adminFetch(`/api/admin/drafts/${encodeURIComponent(draft.id)}`, {
        method: 'POST',
        body: JSON.stringify({
          name,
          nameZh,
          categoryId,
          unitLabel,
          kind,
          repackSourceProductId: kind === 'repack' ? sourceId : null,
          repackYield: kind === 'repack' ? Number(yieldText) : null,
          sellPriceSen,
          costSen,
        }),
      })
      onSaved()
    } catch (e) {
      setMessage(e instanceof AdminApiError ? e.message : 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 max-w-2xl" data-testid="draft-form">
      <div className="flex gap-4 items-start">
        {draft.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- Storage download URL
          <img src={draft.imageUrl} alt={`Photo of ${draft.code}`} className="w-40 h-40 object-cover border border-line" />
        ) : (
          <div className="w-40 h-40 bg-sand flex items-center justify-center text-xs text-muted text-center px-2">Photo not uploaded yet</div>
        )}
        <div className="flex-1 space-y-3">
          <p className="text-sm text-ink font-medium">Code {draft.code}</p>
          <label className={label}>
            Name (English)
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className={label}>
            Name (Chinese)
            <input className={input} value={nameZh} onChange={(e) => setNameZh(e.target.value)} />
          </label>
        </div>
      </div>
      <label className={label}>
        Category
        <select className={input} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Choose…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.nameZh ? ` · ${c.nameZh}` : ''}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-3 gap-4">
        <label className={label}>
          Unit
          <select className={input} value={unitLabel} onChange={(e) => setUnit(e.target.value)}>
            {[...new Set([...UNITS, unitLabel])].map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </label>
        <label className={label}>
          Sell price (RM)
          <input className={input} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>
        <label className={label}>
          Cost (RM)
          <input className={input} inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} />
        </label>
      </div>
      <label className={label}>
        Type
        <select className={input} value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="standard">Standard</option>
          <option value="bulk">Bulk (big bag)</option>
          <option value="repack">Repack (small pack)</option>
        </select>
      </label>
      {kind === 'repack' && (
        <div className="grid grid-cols-2 gap-4">
          <label className={label}>
            Made from
            <select className={input} value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
              <option value="">Choose…</option>
              {bulks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} {b.name}
                </option>
              ))}
            </select>
          </label>
          <label className={label}>
            Packs from one bag
            <input className={input} inputMode="numeric" value={yieldText} onChange={(e) => setYield(e.target.value)} />
          </label>
        </div>
      )}
      {message && <p className="text-sm text-clay">{message}</p>}
      <button
        onClick={save}
        disabled={saving}
        className="bg-ink hover:bg-clay text-paper py-3 px-8 text-xs uppercase tracking-[0.2em] disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save and next'}
      </button>
    </div>
  )
}
