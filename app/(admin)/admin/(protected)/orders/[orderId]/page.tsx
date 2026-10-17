'use client'

import { useParams } from 'next/navigation'
import OrderDetail from '@/components/admin/OrderDetail'

export default function AdminOrderDetailPage() {
  const params = useParams<{ orderId: string }>()
  return <OrderDetail docId={decodeURIComponent(params.orderId)} />
}
