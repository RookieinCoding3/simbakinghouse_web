import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { requireAdmin } from '@/lib/server/adminAuth'
import { handleRouteError } from '@/lib/server/http'
import { klToday, loadStock } from '@/lib/server/stockView'

export const runtime = 'nodejs'

/** Stock & batches for the admin (shared with the SBH Inventory iPad). */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response
  try {
    return NextResponse.json({ today: klToday(), rows: await loadStock(getAdminDb()) })
  } catch (error) {
    return handleRouteError('admin/inventory', error)
  }
}
