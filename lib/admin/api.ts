'use client'

import { auth } from '@/lib/firebase/auth'

export class AdminApiError extends Error {
  status: number
  data: Record<string, unknown>
  constructor(message: string, status: number, data: Record<string, unknown> = {}) {
    super(message)
    this.status = status
    this.data = data
  }
}

/** Calls an /api/admin route as the signed-in user. Throws AdminApiError
 *  with the server's own message (already worded for Sim) on failure. */
export async function adminFetch<T = Record<string, unknown>>(path: string, init: RequestInit = {}): Promise<T> {
  const user = auth.currentUser
  if (!user) throw new AdminApiError('Sign in again to continue.', 401)
  const token = await user.getIdToken()
  let res: Response
  try {
    res = await fetch(path, {
      ...init,
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
        Authorization: `Bearer ${token}`,
      },
    })
  } catch {
    throw new AdminApiError('Could not reach the server. Check your connection.', 0)
  }
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) throw new AdminApiError(typeof data.error === 'string' ? data.error : 'Something went wrong.', res.status, data)
  return data as T
}
