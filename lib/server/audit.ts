import { FieldValue, type Transaction } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase/admin'
import type { AdminCaller } from './adminAuth'

export interface AuditEntry {
  action: string
  entityType: string
  entityId: string
  before: unknown
  after: unknown
  note?: string
}

/**
 * Appends to auditLog inside the caller's transaction, so the log entry and
 * the change it describes commit together or not at all — a write that
 * fails leaves no audit entry behind. auditLog is never client-writable
 * (firestore.rules) and nothing in the app updates or deletes entries.
 */
export function writeAudit(tx: Transaction, caller: AdminCaller, entry: AuditEntry) {
  const ref = getAdminDb().collection('auditLog').doc()
  tx.set(ref, {
    shopId: 'sbh',
    byUid: caller.uid,
    byEmail: caller.email,
    byRole: caller.role,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    before: entry.before ?? null,
    after: entry.after ?? null,
    ...(entry.note ? { note: entry.note } : {}),
    at: FieldValue.serverTimestamp(),
  })
}
