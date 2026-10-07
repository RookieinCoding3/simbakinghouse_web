'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { collection, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { recordReads } from './readMetrics'
import { readStockConfig, readPublicSellUnits, type StockConfig, type SellUnit, type StockStatus } from '@/lib/inventory/catalog'

// One product listener for the whole admin session, shared by every tab.
// The admin root layout never unmounts while Sim moves between tabs, so
// this module-level store lives exactly as long as the session: the first
// visit reads every product once, after that only changed docs are read.
// A sessionStorage snapshot paints the list instantly on reload
// (stale-while-revalidate) while the live listener catches up.

export interface AdminProduct {
  id: string
  name: string
  price: number | null
  category: string
  inStock: boolean
  imageUrl: string
  config: StockConfig
  stockStatus: StockStatus | null
  /** Public (online/both) sizes; wholesale-only ones live in productPrivate. */
  sellUnits: SellUnit[]
  barcodes: string[]
  raw: Record<string, unknown>
}

interface StoreState {
  products: AdminProduct[] | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  stale: boolean
}

const CACHE_KEY = 'sbh-admin-products-v2'

let state: StoreState = { products: null, status: 'idle', stale: false }
const listeners = new Set<() => void>()
let unsubscribe: Unsubscribe | null = null

function emit(next: Partial<StoreState>) {
  state = { ...state, ...next }
  listeners.forEach((l) => l())
}

function normalize(id: string, data: Record<string, unknown>): AdminProduct {
  const priceCandidate = [data.price, data.Price, data.cost].find((v) => typeof v === 'number' && Number.isFinite(v))
  const name = [data.name, data.title, data.productName, data.Name].find((v) => typeof v === 'string' && v)
  return {
    id,
    name: (name as string) ?? 'Untitled product',
    price: (priceCandidate as number | undefined) ?? null,
    category: typeof data.category === 'string' ? data.category : '',
    inStock: data.inStock !== false,
    imageUrl: typeof data.imageUrl === 'string' && data.imageUrl ? data.imageUrl : '/images/placeholder-product.jpg',
    config: readStockConfig(data),
    stockStatus: data.stockStatus === 'in_stock' || data.stockStatus === 'low' || data.stockStatus === 'out' ? data.stockStatus : null,
    sellUnits: readPublicSellUnits(data),
    barcodes: Array.isArray(data.barcodes) ? data.barcodes.filter((b): b is string => typeof b === 'string') : [],
    raw: data,
  }
}

function hydrateFromCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return
    const products = JSON.parse(raw) as AdminProduct[]
    if (Array.isArray(products)) emit({ products, stale: true })
  } catch {}
}

function persist(products: AdminProduct[]) {
  try {
    // `raw` can hold Firestore Timestamps etc. — only cache the display fields.
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(products.map(({ raw: _raw, ...rest }) => ({ ...rest, raw: {} }))))
  } catch {}
}

function start() {
  if (unsubscribe) return
  if (!state.products) hydrateFromCache()
  emit({ status: 'loading' })
  unsubscribe = onSnapshot(
    collection(db, 'products'),
    (snap) => {
      recordReads(snap.docChanges().length)
      const products = snap.docs
        .map((d) => normalize(d.id, d.data()))
        .sort((a, b) => a.name.localeCompare(b.name))
      persist(products)
      emit({ products, status: 'ready', stale: false })
    },
    () => {
      unsubscribe = null
      emit({ status: 'error' })
    }
  )
}

/** Call when the admin signs out so the next account starts clean. */
export function resetProductsStore() {
  unsubscribe?.()
  unsubscribe = null
  try {
    sessionStorage.removeItem(CACHE_KEY)
  } catch {}
  state = { products: null, status: 'idle', stale: false }
  listeners.forEach((l) => l())
}

export function retryProducts() {
  unsubscribe?.()
  unsubscribe = null
  start()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const serverState: StoreState = { products: null, status: 'idle', stale: false }

/** `enabled` = a signed-in user exists (rules need auth before the listener can succeed). */
export function useAdminProducts(enabled: boolean): StoreState {
  const snapshot = useSyncExternalStore(subscribe, () => state, () => serverState)
  useEffect(() => {
    if (enabled) start()
  }, [enabled])
  return snapshot
}

export function getCachedProduct(id: string): AdminProduct | undefined {
  return state.products?.find((p) => p.id === id)
}
