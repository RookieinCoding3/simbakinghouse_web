'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuth } from '@/lib/auth/AuthContext'
import { cartLineKey, type CartItem } from '@/types/cart'
import type { Product, PublicSellUnit } from '@/types/product'
import { onlineUnits, productAvailability } from '@/lib/productView'

const STORAGE_KEY = 'sbh_cart_v1'
const MAX_QTY_PER_ITEM = 99
const CART_SYNC_DEBOUNCE_MS = 800

function mergeCartItems(local: CartItem[], remote: CartItem[]): CartItem[] {
  const merged = [...local]
  for (const remoteItem of remote) {
    const existing = merged.find((item) => cartLineKey(item) === cartLineKey(remoteItem))
    if (existing) {
      existing.qty = Math.min(MAX_QTY_PER_ITEM, existing.qty + remoteItem.qty)
    } else {
      merged.push(remoteItem)
    }
  }
  return merged
}

interface CartContextValue {
  items: CartItem[]
  itemCount: number
  subtotal: number
  hasUnpricedItems: boolean
  isDrawerOpen: boolean
  addItem: (product: Product, qty?: number, unit?: PublicSellUnit) => void
  /** lineKey = cartLineKey(item): one line per product and size */
  removeItem: (lineKey: string) => void
  setQty: (lineKey: string, qty: number) => void
  clear: () => void
  openDrawer: () => void
  closeDrawer: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function isCartItemArray(value: unknown): value is CartItem[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item.productId === 'string' &&
        typeof item.name === 'string' &&
        typeof item.imageUrl === 'string' &&
        (item.unitPrice === null || typeof item.unitPrice === 'number') &&
        typeof item.qty === 'number'
    )
  )
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  // Cart starts empty on the server and every first client render (avoids a
  // hydration mismatch), then loads from localStorage right after mount.
  // Both effects below run on that same initial mount, in declaration
  // order — this ref stops the save effect's first run (which still
  // closes over the pre-load empty `items`) from clobbering what the load
  // effect just read, before the load's setItems has re-rendered.
  const isInitialMount = useRef(true)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (isCartItemArray(parsed)) setItems(parsed)
      }
    } catch {
      // Corrupted storage or storage unavailable (private browsing, etc.) —
      // just start with an empty cart.
    }
  }, [])

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Storage full/unavailable — the cart still works for this session,
      // it just won't survive a refresh.
    }
  }, [items])

  // Signed-in cart sync. Two parts:
  // 1. On sign-in, merge whatever's saved in carts/{uid} with whatever's
  //    currently in local state (guest browsing before login isn't lost).
  // 2. While signed in, debounce-write local changes back to Firestore.
  // Signing out does NOT clear the local cart — it just stops syncing, so
  // browsing continues to work as a guest cart, same as before login.
  const { user } = useAuth()
  const mergedForUid = useRef<string | null>(null)

  useEffect(() => {
    if (!user) {
      mergedForUid.current = null
      return
    }
    if (mergedForUid.current === user.uid) return
    let cancelled = false
    ;(async () => {
      try {
        const snap = await getDoc(doc(db, 'carts', user.uid))
        const remoteItems = snap.exists() && isCartItemArray(snap.data().items) ? snap.data().items : []
        if (cancelled) return
        mergedForUid.current = user.uid
        if (remoteItems.length > 0) {
          setItems((prev) => mergeCartItems(prev, remoteItems))
        }
      } catch {
        // Offline or a transient read failure — keep whatever's local;
        // the write effect below will still try to sync it once online.
        mergedForUid.current = user.uid
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    if (!user || mergedForUid.current !== user.uid) return
    const timer = setTimeout(() => {
      setDoc(doc(db, 'carts', user.uid), { items, updatedAt: Date.now() }).catch(() => {
        // Offline or a transient write failure — local state (and
        // localStorage) is still correct, this just means the next
        // successful sign-in on another device won't see this change
        // until a later write succeeds.
      })
    }, CART_SYNC_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [items, user])

  const addItem = (product: Product, qty = 1, chosen?: PublicSellUnit) => {
    if (!productAvailability(product).sellable) return
    const units = onlineUnits(product)
    const unit = chosen ?? units[0]
    if (!unit) return
    // Products with a single size keep the exact cart shape they always had.
    const sized = units.length > 1 ? { sellUnitId: unit.id, sellUnitLabel: unit.label } : {}
    const key = cartLineKey({ productId: product.id, ...sized })
    setItems((prev) => {
      const existing = prev.find((item) => cartLineKey(item) === key)
      if (existing) {
        return prev.map((item) =>
          cartLineKey(item) === key ? { ...item, qty: Math.min(MAX_QTY_PER_ITEM, item.qty + qty) } : item
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          imageUrl: product.imageUrl,
          unitPrice: unit.priceSen === null ? null : unit.priceSen / 100,
          qty: Math.min(MAX_QTY_PER_ITEM, qty),
          ...sized,
        },
      ]
    })
    setIsDrawerOpen(true)
  }

  const removeItem = (lineKey: string) => {
    setItems((prev) => prev.filter((item) => cartLineKey(item) !== lineKey))
  }

  const setQty = (lineKey: string, qty: number) => {
    if (qty <= 0) {
      removeItem(lineKey)
      return
    }
    setItems((prev) =>
      prev.map((item) => (cartLineKey(item) === lineKey ? { ...item, qty: Math.min(MAX_QTY_PER_ITEM, qty) } : item))
    )
  }

  const clear = () => setItems([])
  const openDrawer = () => setIsDrawerOpen(true)
  const closeDrawer = () => setIsDrawerOpen(false)

  const { itemCount, subtotal, hasUnpricedItems } = useMemo(() => {
    let itemCount = 0
    let subtotal = 0
    let hasUnpricedItems = false
    for (const item of items) {
      itemCount += item.qty
      if (item.unitPrice === null) {
        hasUnpricedItems = true
      } else {
        subtotal += item.unitPrice * item.qty
      }
    }
    return { itemCount, subtotal, hasUnpricedItems }
  }, [items])

  const value: CartContextValue = {
    items,
    itemCount,
    subtotal,
    hasUnpricedItems,
    isDrawerOpen,
    addItem,
    removeItem,
    setQty,
    clear,
    openDrawer,
    closeDrawer,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
