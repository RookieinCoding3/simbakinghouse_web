'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAdminSession } from '@/lib/admin/AdminSession'
import { adminFetch, AdminApiError } from '@/lib/admin/api'
import { parseRMToSen, senToRMString, formatSen } from '@/lib/money'
import { cn } from '@/lib/utils/cn'
import { PageSkeleton, notifyAdminChanged } from '@/components/admin/AdminShell'
import { BADGE_COLORS, type BadgeColor, type PromoType, type SaleEventPromo } from '@/lib/promotions/types'
import { isLive } from '@/lib/promotions/engine'

interface P {
  id: string
  name: string
  category: string
  price: number | null
}

const TEMPLATES: { type: PromoType; icon: string; title: string; body: string }[] = [
  { type: 'PRODUCT_BADGE', icon: '🏷️', title: 'Product badge', body: 'A badge on chosen products ("CLEARANCE", "RM 2 OFF"), with optional % off.' },
  { type: 'MIX_AND_MATCH', icon: '🧺', title: 'Mix & Match', body: 'Any N from a pool for one price, e.g. 3 premixes for RM 25.' },
  { type: 'SPEND_THRESHOLD', icon: '💰', title: 'Spend & save', body: 'Spend RM 300, get RM 10 off. Shows "almost there" near the target.' },
]

const field = 'w-full bg-white border border-line rounded-lg py-3 px-4 text-base min-h-[48px] focus:outline-none focus:border-ink/50'
const label = 'block text-xs uppercase tracking-widest text-ink/70 mb-1.5'
const klToday = () => new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10)

function blank(type: PromoType): SaleEventPromo {
  const id = `promo_${Date.now().toString(36)}`
  if (type === 'PRODUCT_BADGE') return { id, name: '', active: true, type, badgeConfig: { badgeTextEn: '', badgeTextZh: '', badgeColor: 'red', productIds: [] } }
  if (type === 'MIX_AND_MATCH') return { id, name: '', active: true, type, mixMatchConfig: { eligibleProductIds: [], requiredQty: 3, bundlePriceSen: 2500, promptTextEn: '', promptTextZh: '' } }
  return { id, name: '', active: true, type, thresholdConfig: { minSpendSen: 30000, discountSen: 1000, upsellThresholdSen: 22000 } }
}

function summary(p: SaleEventPromo, products: P[]): string {
  const names = (ids: string[]) => {
    const n = ids.map((id) => products.find((x) => x.id === id)?.name).filter(Boolean)
    return n.length > 2 ? `${n.slice(0, 2).join(', ')} +${n.length - 2}` : n.join(', ')
  }
  if (p.badgeConfig) return `"${p.badgeConfig.badgeTextEn}"${p.badgeConfig.discountPercent ? ` · ${p.badgeConfig.discountPercent}% off` : ''} · ${names(p.badgeConfig.productIds)}`
  if (p.mixMatchConfig) return `Any ${p.mixMatchConfig.requiredQty} for ${formatSen(p.mixMatchConfig.bundlePriceSen)} · ${names(p.mixMatchConfig.eligibleProductIds)}`
  if (p.thresholdConfig) return `Spend ${formatSen(p.thresholdConfig.minSpendSen)}, get ${formatSen(p.thresholdConfig.discountSen)} off`
  return ''
}

export default function PromosPage() {
  const { user } = useAdminSession()
  const [promos, setPromos] = useState<SaleEventPromo[] | null>(null)
  const [products, setProducts] = useState<P[]>([])
  const [editing, setEditing] = useState<SaleEventPromo | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  const load = useCallback(() => {
    adminFetch<{ promos: SaleEventPromo[]; products: P[] }>('/api/admin/promotions')
      .then((d) => {
        setPromos(d.promos)
        setProducts(d.products)
      })
      .catch((e) => setError(e instanceof AdminApiError ? e.message : 'Could not load sale events.'))
  }, [])
  useEffect(() => {
    if (user) load()
  }, [user, load])

  const save = async (next: SaleEventPromo[], message: string) => {
    setSaving(true)
    setError(null)
    setSaved(null)
    try {
      const r = await adminFetch<{ promos: SaleEventPromo[] }>('/api/admin/promotions', { method: 'PUT', body: JSON.stringify({ promos: next }) })
      setPromos(r.promos)
      setSaved(message)
      notifyAdminChanged()
      return true
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : 'Could not save. Check your connection and try again.')
      return false
    } finally {
      setSaving(false)
    }
  }

  if (!promos) return error ? <p role="alert" className="text-sm text-clay">{error}</p> : <PageSkeleton />
  const today = klToday()

  if (editing) {
    return (
      <PromoEditor
        promo={editing}
        products={products}
        saving={saving}
        error={error}
        onCancel={() => {
          setEditing(null)
          setError(null)
        }}
        onSave={async (p) => {
          const exists = promos.some((x) => x.id === p.id)
          if (await save(exists ? promos.map((x) => (x.id === p.id ? p : x)) : [...promos, p], `Saved "${p.name}".`)) setEditing(null)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-ink text-2xl md:text-3xl">Sale events</h1>
        <p className="text-xs text-muted mt-1">Discounts are worked out by the server at checkout; the cart shows the same numbers.</p>
      </div>

      {saved && <p className="text-sm text-[#1F5E3B]" role="status">{saved}</p>}
      {error && <p className="text-sm text-clay" role="alert">{error}</p>}

      <section aria-labelledby="live-title" className="space-y-3">
        <h2 id="live-title" className="text-sm font-semibold text-ink">Your sale events</h2>
        {promos.length === 0 && <p className="text-sm text-muted bg-white border border-line rounded-2xl p-5">No sale events yet. Start one from a template below.</p>}
        <ul className="space-y-3" data-testid="promo-list">
          {promos.map((p) => {
            const live = isLive(p, today)
            return (
              <li key={p.id} className="bg-white border border-line rounded-2xl p-4 flex items-center gap-4" data-testid="promo-row">
                <button
                  role="switch"
                  aria-checked={p.active}
                  aria-label={`${p.name}: ${p.active ? 'on' : 'off'}`}
                  disabled={saving}
                  onClick={() => save(promos.map((x) => (x.id === p.id ? { ...x, active: !x.active } : x)), `${p.name} is ${p.active ? 'off' : 'on'}.`)}
                  className={cn('relative w-14 h-8 rounded-full transition-colors flex-shrink-0', p.active ? 'bg-[#1F7A4D]' : 'bg-line')}
                  data-testid="promo-toggle"
                >
                  <span className={cn('absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all', p.active ? 'left-7' : 'left-1')} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink flex items-center gap-2 flex-wrap">
                    {p.name}
                    <span className={cn('text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded', live ? 'bg-emerald-100 text-emerald-900' : 'bg-sand text-muted')}>
                      {live ? 'Live' : p.active ? 'Scheduled / ended' : 'Off'}
                    </span>
                  </p>
                  <p className="text-xs text-muted truncate">{summary(p, products)}</p>
                  {(p.startDate || p.endDate) && <p className="text-xs text-muted">{p.startDate ?? '…'} → {p.endDate ?? '…'}</p>}
                </div>
                <button onClick={() => setEditing(p)} className="border border-ink rounded-lg px-3 min-h-[44px] text-xs font-semibold">Edit</button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete "${p.name}"?`)) save(promos.filter((x) => x.id !== p.id), `Deleted "${p.name}".`)
                  }}
                  className="text-clay text-xs underline min-h-[44px] px-1"
                >
                  Delete
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-labelledby="tpl-title" className="space-y-3">
        <h2 id="tpl-title" className="text-sm font-semibold text-ink">Start a new sale</h2>
        <div className="grid md:grid-cols-3 gap-3">
          {TEMPLATES.map((t) => (
            <button key={t.type} onClick={() => setEditing(blank(t.type))} className="text-left bg-white border border-line rounded-2xl p-5 hover:border-ink min-h-[128px]" data-testid={`template-${t.type}`}>
              <span className="text-2xl" aria-hidden="true">{t.icon}</span>
              <span className="block mt-2 text-sm font-semibold text-ink">{t.title}</span>
              <span className="block mt-1 text-xs text-muted">{t.body}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

function ProductPicker({ products, value, onChange, testId }: { products: P[]; value: string[]; onChange: (ids: string[]) => void; testId: string }) {
  const [q, setQ] = useState('')
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    return s ? products.filter((p) => `${p.name} ${p.category}`.toLowerCase().includes(s)) : products
  }, [products, q])
  return (
    <div data-testid={testId}>
      <input className={field} value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search products (${value.length} chosen)`} aria-label="Search products" />
      <ul className="mt-2 max-h-64 overflow-y-auto border border-line rounded-lg divide-y divide-line bg-white">
        {shown.map((p) => (
          <li key={p.id}>
            <label className="flex items-center gap-3 px-4 min-h-[48px] text-sm cursor-pointer hover:bg-sand">
              <input type="checkbox" checked={value.includes(p.id)} onChange={(e) => onChange(e.target.checked ? [...value, p.id] : value.filter((x) => x !== p.id))} />
              <span className="flex-1">{p.name}</span>
              <span className="text-xs text-muted">{p.price !== null ? `RM ${p.price.toFixed(2)}` : ''}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PromoEditor({ promo, products, saving, error, onCancel, onSave }: {
  promo: SaleEventPromo
  products: P[]
  saving: boolean
  error: string | null
  onCancel: () => void
  onSave: (p: SaleEventPromo) => void
}) {
  const [p, setP] = useState<SaleEventPromo>(promo)
  const [local, setLocal] = useState<string | null>(null)
  const [money, setMoney] = useState(() => ({
    bundle: p.mixMatchConfig ? senToRMString(p.mixMatchConfig.bundlePriceSen) : '',
    min: p.thresholdConfig ? senToRMString(p.thresholdConfig.minSpendSen) : '',
    off: p.thresholdConfig ? senToRMString(p.thresholdConfig.discountSen) : '',
    upsell: p.thresholdConfig ? senToRMString(p.thresholdConfig.upsellThresholdSen) : '',
  }))

  const submit = () => {
    setLocal(null)
    const out: SaleEventPromo = { ...p }
    if (out.mixMatchConfig) {
      const b = parseRMToSen(money.bundle)
      if (b === null) return setLocal('Enter the bundle price like 25.00')
      out.mixMatchConfig = { ...out.mixMatchConfig, bundlePriceSen: b }
    }
    if (out.thresholdConfig) {
      const min = parseRMToSen(money.min)
      const off = parseRMToSen(money.off)
      const up = money.upsell.trim() ? parseRMToSen(money.upsell) : 0
      if (min === null || off === null || up === null) return setLocal('Enter amounts like 300.00')
      out.thresholdConfig = { minSpendSen: min, discountSen: off, upsellThresholdSen: up }
    }
    onSave(out)
  }

  const t = TEMPLATES.find((x) => x.type === p.type)!
  return (
    <div className="space-y-5 max-w-2xl" data-testid="promo-editor">
      <button onClick={onCancel} className="text-xs text-muted hover:text-ink">&larr; Back to sale events</button>
      <h1 className="font-heading text-ink text-2xl md:text-3xl">{t.icon} {t.title}</h1>

      <div>
        <label htmlFor="promo-name" className={label}>Sale name</label>
        <input id="promo-name" className={field} value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} placeholder="e.g. Butter Clearance" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="promo-start" className={label}>Starts (optional)</label>
          <input id="promo-start" type="date" className={field} value={p.startDate ?? ''} onChange={(e) => setP({ ...p, startDate: e.target.value || undefined })} />
        </div>
        <div>
          <label htmlFor="promo-end" className={label}>Ends (optional)</label>
          <input id="promo-end" type="date" className={field} value={p.endDate ?? ''} onChange={(e) => setP({ ...p, endDate: e.target.value || undefined })} />
        </div>
      </div>

      {p.badgeConfig && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="badge-en" className={label}>Badge text</label>
              <input id="badge-en" className={field} value={p.badgeConfig.badgeTextEn} onChange={(e) => setP({ ...p, badgeConfig: { ...p.badgeConfig!, badgeTextEn: e.target.value } })} placeholder="CLEARANCE" maxLength={24} />
            </div>
            <div>
              <label htmlFor="badge-zh" className={label}>Badge text (中文)</label>
              <input id="badge-zh" className={field} value={p.badgeConfig.badgeTextZh ?? ''} onChange={(e) => setP({ ...p, badgeConfig: { ...p.badgeConfig!, badgeTextZh: e.target.value } })} placeholder="清仓特价" maxLength={24} />
            </div>
          </div>
          <fieldset>
            <legend className={label}>Badge colour</legend>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(BADGE_COLORS) as BadgeColor[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={p.badgeConfig!.badgeColor === c}
                  onClick={() => setP({ ...p, badgeConfig: { ...p.badgeConfig!, badgeColor: c } })}
                  className={cn('px-4 min-h-[44px] rounded-lg text-xs font-semibold border-2', p.badgeConfig!.badgeColor === c ? 'border-ink' : 'border-transparent')}
                  style={{ background: BADGE_COLORS[c].bg, color: BADGE_COLORS[c].fg }}
                >
                  {p.badgeConfig!.badgeTextEn || BADGE_COLORS[c].label}
                </button>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="badge-pct" className={label}>% off (optional, 1–90)</label>
            <input id="badge-pct" className={field} inputMode="numeric" value={p.badgeConfig.discountPercent ?? ''} onChange={(e) => setP({ ...p, badgeConfig: { ...p.badgeConfig!, discountPercent: e.target.value ? Number(e.target.value.replace(/\D/g, '')) : undefined } })} placeholder="Leave empty for a badge only" />
          </div>
          <div>
            <span className={label}>Products</span>
            <ProductPicker products={products} value={p.badgeConfig.productIds} onChange={(ids) => setP({ ...p, badgeConfig: { ...p.badgeConfig!, productIds: ids } })} testId="badge-products" />
          </div>
        </>
      )}

      {p.mixMatchConfig && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="mm-qty" className={label}>Pick how many</label>
              <input id="mm-qty" className={field} inputMode="numeric" value={p.mixMatchConfig.requiredQty} onChange={(e) => setP({ ...p, mixMatchConfig: { ...p.mixMatchConfig!, requiredQty: Number(e.target.value.replace(/\D/g, '')) || 0 } })} />
            </div>
            <div>
              <label htmlFor="mm-price" className={label}>For (RM)</label>
              <input id="mm-price" className={field} inputMode="decimal" value={money.bundle} onChange={(e) => setMoney({ ...money, bundle: e.target.value })} />
            </div>
          </div>
          <div>
            <span className={label}>Products in the pool</span>
            <ProductPicker products={products} value={p.mixMatchConfig.eligibleProductIds} onChange={(ids) => setP({ ...p, mixMatchConfig: { ...p.mixMatchConfig!, eligibleProductIds: ids } })} testId="mm-products" />
          </div>
          <div>
            <label htmlFor="mm-en" className={label}>Cart message (optional; {'{remaining}'} = items still needed)</label>
            <input id="mm-en" className={field} value={p.mixMatchConfig.promptTextEn} onChange={(e) => setP({ ...p, mixMatchConfig: { ...p.mixMatchConfig!, promptTextEn: e.target.value } })} placeholder={`Add {remaining} more item(s) to get ${p.mixMatchConfig.requiredQty} for RM${money.bundle || '…'}!`} />
          </div>
          <div>
            <label htmlFor="mm-zh" className={label}>Cart message (中文, optional)</label>
            <input id="mm-zh" className={field} value={p.mixMatchConfig.promptTextZh} onChange={(e) => setP({ ...p, mixMatchConfig: { ...p.mixMatchConfig!, promptTextZh: e.target.value } })} placeholder={`再加 {remaining} 件，${p.mixMatchConfig.requiredQty} 件只要 RM${money.bundle || '…'}！`} />
          </div>
        </>
      )}

      {p.thresholdConfig && (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="th-min" className={label}>Spend (RM)</label>
            <input id="th-min" className={field} inputMode="decimal" value={money.min} onChange={(e) => setMoney({ ...money, min: e.target.value })} />
          </div>
          <div>
            <label htmlFor="th-off" className={label}>Get off (RM)</label>
            <input id="th-off" className={field} inputMode="decimal" value={money.off} onChange={(e) => setMoney({ ...money, off: e.target.value })} />
          </div>
          <div>
            <label htmlFor="th-up" className={label}>&quot;Almost there&quot; from (RM)</label>
            <input id="th-up" className={field} inputMode="decimal" value={money.upsell} onChange={(e) => setMoney({ ...money, upsell: e.target.value })} />
          </div>
        </div>
      )}

      <label className="flex items-center gap-3 text-sm min-h-[44px]">
        <input type="checkbox" checked={p.active} onChange={(e) => setP({ ...p, active: e.target.checked })} />
        On (live during its dates)
      </label>

      {(local || error) && <p role="alert" className="text-sm text-clay">{local || error}</p>}
      <div className="flex gap-3">
        <button onClick={submit} disabled={saving} className="flex-1 bg-ink text-paper rounded-lg min-h-[56px] text-sm font-semibold uppercase tracking-[0.15em] disabled:opacity-50">
          {saving ? 'Saving…' : 'Save sale'}
        </button>
        <button onClick={onCancel} className="px-6 border border-line rounded-lg min-h-[56px] text-sm">Cancel</button>
      </div>
    </div>
  )
}
