import { NextResponse } from 'next/server'

/** An expected refusal with a message already worded for Sim. */
export class Refused extends Error {
  status: number
  data: Record<string, unknown>
  constructor(message: string, status = 409, data: Record<string, unknown> = {}) {
    super(message)
    this.status = status
    this.data = data
  }
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  const body = await request.json().catch(() => null)
  return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : {}
}

export function handleRouteError(scope: string, error: unknown, fallback = 'Something went wrong. Try again.') {
  if (error instanceof Refused) return NextResponse.json({ error: error.message, ...error.data }, { status: error.status })
  console.error(`[${scope}] failed:`, error)
  return NextResponse.json({ error: fallback }, { status: 500 })
}

export function isOpId(v: unknown): v is string {
  return typeof v === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(v)
}

export function isMilli(v: unknown, { allowZero = false } = {}): v is number {
  return typeof v === 'number' && Number.isInteger(v) && (allowZero ? v >= 0 : v > 0) && v <= 1e12
}

export function isIsoDate(v: unknown): v is string {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
}
