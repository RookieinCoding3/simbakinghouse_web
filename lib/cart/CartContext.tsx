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
import type { CartItem } from '@/types/cart'
import type { Product } from '@/types/product'

const STORAGE_KEY = 'sbh_cart_v1'
const MAX_QTY_PER_ITEM = 99

interface CartContextValue {
  items: CartItem[]
  itemCount: number
  subtotal: number
  hasUnpricedItems: boolean
  isDrawerOpen: boolean
  addItem: (product: Product, qty?: number) => void
  removeItem: (productId: string) => void
  setQty: (productId: string, qty: number) => void
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

  const addItem = (product: Product, qty = 1) => {
    if (!product.inStock) return
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id)
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, qty: Math.min(MAX_QTY_PER_ITEM, item.qty + qty) }
            : item
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          imageUrl: product.imageUrl,
          unitPrice: product.price ?? null,
          qty: Math.min(MAX_QTY_PER_ITEM, qty),
        },
      ]
    })
    setIsDrawerOpen(true)
  }

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId))
  }

  const setQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeItem(productId)
      return
    }
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, qty: Math.min(MAX_QTY_PER_ITEM, qty) } : item
      )
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
