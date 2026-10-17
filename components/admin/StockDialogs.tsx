'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { adminFetch, AdminApiError } from '@/lib/admin/api'
import { parseRMToSen } from '@/lib/money'
import { formatQty, parseQtyToMilli } from '@/lib/inventory/units'
import { notifyAdminChanged } from './AdminShell'

export interface PickProduct {
  id: string
  name: string
  code: string
  unit: string
  category?: string
}

export interface PickBatch {
  id: string
  qtyMilli: number
  expiryDate: string | null
  supplierName: string | null
}

const field = 'w-full bg-white border border-line rounded-lg py-3 px-4 text-ink text-base focus:outline-none focus:border-ink/50 min-h-[48px]'
const label = 'block text-xs uppercase tracking-widest text-ink/70 mb-1.5'

function Dialog({ title, onClose, children, testId }: { title: string; onClose: () => void; children: ReactNode; testId: string }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={title} data-testid={testId}>
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div className="relative bg-paper w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-2xl p-6" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-2xl text-ink">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="w-11 h-11 flex items-center justify-center text-ink/60 text-xl">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

/** + Receive Batch: qty, cost, supplier, expiry → a new batch (FEFO). */
export function ReceiveBatchDialog({ products, initialProductId, suppliers = [], onClose, onDone }: {
  products: PickProduct[]
  initialProductId?: string
  suppliers?: string[]
  onClose: () => void
  onDone: () => void
}) {
  const [productId, setProductId] = useState(initialProductId ?? '')
  const [search, setSearch] = useState('')
  const [qty, setQty] = useState('')
  const [cost, setCost] = useState('')
  const [supplier, setSupplier] = useState('')
  const [expiry, setExpiry] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const product = products.find((p) => p.id === productId)
  const matches = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (q ? products.filter((p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)) : products).slice(0, 8)
  }, [products, search])

  const save = async () => {
    setError(null)
    if (!product) return setError('Choose a product.')
    const qtyMilli = parseQtyToMilli(qty)
    if (qtyMilli === null || qtyMilli <= 0) return setError(`Enter how many ${product.unit} arrived.`)
    const unitCostSen = cost.trim() ? parseRMToSen(cost) : null
    if (cost.trim() && unitCostSen === null) return setError('Enter the cost like 11.50')
    setBusy(true)
    try {
      await adminFetch('/api/admin/inventory/receive', {
        method: 'POST',
        body: JSON.stringify({ productId, qtyMilli, unitCostSen, supplierName: supplier, expiryDate: expiry || null, note }),
      })
      notifyAdminChanged()
      onDone()
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : 'Could not save. Check your connection and try again.')
      setBusy(false)
    }
  }

  return (
    <Dialog title="Receive stock" onClose={onClose} testId="receive-dialog">
      <div className="space-y-4">
        {product ? (
          <div className="flex items-center justify-between gap-3 bg-sand rounded-lg px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink truncate">{product.name}</p>
              <p className="text-xs text-muted">{product.code ? `${product.code} · ` : ''}counted in {product.unit}</p>
            </div>
            {!initialProductId && (
              <button onClick={() => setProductId('')} className="text-xs underline text-ink/70 min-h-[44px] px-2">Change</button>
            )}
          </div>
        ) : (
          <div>
            <label htmlFor="rcv-search" className={label}>Product</label>
            <input id="rcv-search" className={field} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or code" autoFocus />
            <ul className="mt-2 border border-line rounded-lg divide-y divide-line bg-white">
              {matches.map((p) => (
                <li key={p.id}>
                  <button onClick={() => setProductId(p.id)} className="w-full text-left px-4 min-h-[48px] text-sm hover:bg-sand">
                    {p.name} <span className="text-muted">{p.code}</span>
                  </button>
                </li>
              ))}
              {matches.length === 0 && <li className="px-4 py-3 text-sm text-muted">No match.</li>}
            </ul>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="rcv-qty" className={label}>Quantity{product ? ` (${product.unit})` : ''}</label>
            <input id="rcv-qty" className={field} inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="24" />
          </div>
          <div>
            <label htmlFor="rcv-cost" className={label}>Cost per {product?.unit ?? 'unit'} (RM)</label>
            <input id="rcv-cost" className={field} inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="11.50" />
          </div>
        </div>
        <div>
          <label htmlFor="rcv-supplier" className={label}>Supplier</label>
          <input id="rcv-supplier" className={field} value={supplier} onChange={(e) => setSupplier(e.target.value)} list="rcv-suppliers" placeholder="e.g. Anchor Malaysia" />
          <datalist id="rcv-suppliers">
            {suppliers.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor="rcv-expiry" className={label}>Expiry date (leave empty if none)</label>
          <input id="rcv-expiry" className={field} type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        </div>
        <div>
          <label htmlFor="rcv-note" className={label}>Note (optional)</label>
          <input id="rcv-note" className={field} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        {error && <p role="alert" className="text-sm text-clay">{error}</p>}
        <button onClick={save} disabled={busy} className="w-full bg-ink text-paper rounded-lg min-h-[56px] text-sm font-semibold uppercase tracking-[0.15em] disabled:opacity-50">
          {busy ? 'Saving…' : 'Receive batch'}
        </button>
      </div>
    </Dialog>
  )
}

/** ± Adjust: damaged/spilled off a chosen batch, or a manual recount. */
export function AdjustDialog({ product, batches, onHandMilli, onClose, onDone }: {
  product: PickProduct
  batches: PickBatch[]
  onHandMilli: number
  onClose: () => void
  onDone: () => void
}) {
  const [mode, setMode] = useState<'wastage' | 'recount'>(batches.length ? 'wastage' : 'recount')
  const [batchId, setBatchId] = useState(batches[0]?.id ?? '')
  const [qty, setQty] = useState('')
  const [reason, setReason] = useState('damaged')
  const [counted, setCounted] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    setError(null)
    let body: Record<string, unknown>
    if (mode === 'wastage') {
      const qtyMilli = parseQtyToMilli(qty)
      if (!batchId) return setError('Choose the batch.')
      if (qtyMilli === null || qtyMilli <= 0) return setError(`Enter how many ${product.unit} to take off.`)
      body = { mode, batchId, qtyMilli, reason }
    } else {
      const countedMilli = parseQtyToMilli(counted)
      if (countedMilli === null || countedMilli < 0) return setError(`Enter how many ${product.unit} you counted.`)
      body = { mode, productId: product.id, countedMilli }
    }
    setBusy(true)
    try {
      await adminFetch('/api/admin/inventory/adjust', { method: 'POST', body: JSON.stringify(body) })
      notifyAdminChanged()
      onDone()
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : 'Could not save. Check your connection and try again.')
      setBusy(false)
    }
  }

  const tab = (m: 'wastage' | 'recount', text: string) => (
    <button
      onClick={() => setMode(m)}
      aria-pressed={mode === m}
      disabled={m === 'wastage' && batches.length === 0}
      className={`flex-1 min-h-[48px] rounded-lg text-sm font-medium disabled:opacity-40 ${mode === m ? 'bg-ink text-paper' : 'bg-sand text-ink'}`}
    >
      {text}
    </button>
  )

  return (
    <Dialog title={`Adjust · ${product.name}`} onClose={onClose} testId="adjust-dialog">
      <div className="space-y-4">
        <div className="flex gap-2">
          {tab('wastage', 'Damaged / spilled')}
          {tab('recount', 'Recount')}
        </div>
        {mode === 'wastage' ? (
          <>
            <fieldset>
              <legend className={label}>From which batch</legend>
              <div className="space-y-2">
                {batches.map((b) => (
                  <label key={b.id} className={`flex items-center gap-3 border rounded-lg px-4 min-h-[48px] text-sm ${batchId === b.id ? 'border-ink bg-sand' : 'border-line bg-white'}`}>
                    <input type="radio" name="adj-batch" checked={batchId === b.id} onChange={() => setBatchId(b.id)} />
                    <span className="flex-1">
                      {formatQty(b.qtyMilli, product.unit)} · {b.expiryDate ? `Exp ${b.expiryDate}` : 'No expiry'}
                      {b.supplierName && <span className="text-muted"> · {b.supplierName}</span>}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="adj-qty" className={label}>Take off ({product.unit})</label>
                <input id="adj-qty" className={field} inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} />
              </div>
              <div>
                <label htmlFor="adj-reason" className={label}>Reason</label>
                <select id="adj-reason" className={field} value={reason} onChange={(e) => setReason(e.target.value)}>
                  <option value="damaged">Damaged</option>
                  <option value="spilled">Spilled</option>
                  <option value="expired">Expired</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </>
        ) : (
          <div>
            <p className="text-sm text-muted mb-2">The system says {formatQty(onHandMilli, product.unit)} on hand.</p>
            <label htmlFor="adj-count" className={label}>You counted ({product.unit})</label>
            <input id="adj-count" className={field} inputMode="decimal" value={counted} onChange={(e) => setCounted(e.target.value)} autoFocus />
          </div>
        )}
        {error && <p role="alert" className="text-sm text-clay">{error}</p>}
        <button onClick={save} disabled={busy} className="w-full bg-ink text-paper rounded-lg min-h-[56px] text-sm font-semibold uppercase tracking-[0.15em] disabled:opacity-50">
          {busy ? 'Saving…' : mode === 'wastage' ? 'Take off stock' : 'Save count'}
        </button>
      </div>
    </Dialog>
  )
}
