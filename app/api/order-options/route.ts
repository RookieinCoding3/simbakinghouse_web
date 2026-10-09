import { NextResponse } from 'next/server'
import { fetchOrderTypes } from '@/lib/server/orderTypes'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Public: which ways of collecting the checkout may offer. No stock, no prices. */
export async function GET() {
  const orderTypes = await fetchOrderTypes()
  return NextResponse.json(orderTypes, { headers: { 'Cache-Control': 'public, max-age=60' } })
}
