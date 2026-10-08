'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { collection, onSnapshot, query, where, type Query, type Unsubscribe } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { recordReads } from './readMetrics'

// One live listener per collection for the whole admin session, shared by
// every screen (same idea as productsStore): the first screen that needs it
// reads it once, later screens and tab switches read nothing more.

export interface CollectionState<T> {
  docs: Map<string, T> | null
  status: 'idle' | 'loading' | 'ready' | 'error'
}

/** `source` narrows the listener to a query; default is the whole collection. */
export function createCollectionStore<T>(
  name: string,
  normalize: (id: string, data: Record<string, unknown>) => T,
  source: () => Query = () => collection(db, name)
) {
  let state: CollectionState<T> = { docs: null, status: 'idle' }
  const listeners = new Set<() => void>()
  let unsubscribe: Unsubscribe | null = null
  const emit = (next: CollectionState<T>) => {
    state = next
    listeners.forEach((l) => l())
  }
  const start = () => {
    if (unsubscribe) return
    emit({ ...state, status: state.docs ? 'ready' : 'loading' })
    unsubscribe = onSnapshot(
      source(),
      (snap) => {
        recordReads(snap.docChanges().length)
        emit({ docs: new Map(snap.docs.map((d) => [d.id, normalize(d.id, d.data())])), status: 'ready' })
      },
      () => {
        unsubscribe = null
        emit({ ...state, status: 'error' })
      }
    )
  }
  const server: CollectionState<T> = { docs: null, status: 'idle' }
  return {
    use(enabled: boolean): CollectionState<T> {
      const snapshot = useSyncExternalStore(
        (l) => {
          listeners.add(l)
          return () => listeners.delete(l)
        },
        () => state,
        () => server
      )
      useEffect(() => {
        if (enabled) start()
      }, [enabled])
      return snapshot
    },
    reset() {
      unsubscribe?.()
      unsubscribe = null
      emit({ docs: null, status: 'idle' })
    },
    retry() {
      unsubscribe?.()
      unsubscribe = null
      start()
    },
  }
}

function millis(v: unknown): number | null {
  if (v && typeof v === 'object' && 'toMillis' in v && typeof (v as { toMillis: unknown }).toMillis === 'function') {
    return (v as { toMillis: () => number }).toMillis()
  }
  return typeof v === 'number' ? v : null
}

export interface InventoryDoc {
  onHandMilli: number
  reservedMilli: number
  lastCountedAt: number | null
}

export const inventoryStore = createCollectionStore<InventoryDoc>('inventory', (_id, d) => ({
  onHandMilli: Number(d.onHandMilli) || 0,
  reservedMilli: Number(d.reservedMilli) || 0,
  lastCountedAt: millis(d.lastCountedAt),
}))

export interface CountDraft {
  countedMilli: number
  countedAt: number | null
}

export const draftsStore = createCollectionStore<CountDraft>('stockCountDrafts', (_id, d) => ({
  countedMilli: Number(d.countedMilli) || 0,
  countedAt: millis(d.countedAt),
}))

export interface PrivateProduct {
  wholesaleUnits: unknown[]
}

export const privateStore = createCollectionStore<PrivateProduct>('productPrivate', (_id, d) => ({
  wholesaleUnits: Array.isArray(d.wholesaleUnits) ? d.wholesaleUnits : [],
}))

export interface RunningLowDoc {
  stockStatus: 'low' | 'out'
}

/** Managed products that are low or out, for the Stock-tab badge. Reads only
 *  those docs (usually a handful), not the whole catalogue, so it's cheap to
 *  run on every admin page. stockStatus is set by the server in the same
 *  transaction as every stock change, so this stays exact. */
export const runningLowStore = createCollectionStore<RunningLowDoc>(
  'products',
  (_id, d) => ({ stockStatus: d.stockStatus === 'out' ? 'out' : 'low' }),
  () => query(collection(db, 'products'), where('managedStock', '==', true), where('stockStatus', 'in', ['low', 'out']))
)
