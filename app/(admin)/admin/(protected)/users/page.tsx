'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAdminSession } from '@/lib/admin/AdminSession'
import { adminFetch, AdminApiError } from '@/lib/admin/api'
import { cn } from '@/lib/utils/cn'

interface AdminUser {
  uid: string
  email: string | null
  displayName: string | null
  signInMethods: string[]
  role: 'admin' | 'owner'
  roleIsImplicit: boolean
  isYou: boolean
}

const METHOD_LABEL: Record<string, string> = { 'google.com': 'Google', password: 'Email & password' }

export default function UsersPage() {
  const { role, user } = useAdminSession()
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [newRole, setNewRole] = useState<'owner' | 'admin'>('owner')
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoadError(null)
    try {
      const data = await adminFetch<{ users: AdminUser[] }>('/api/admin/users')
      setUsers(data.users)
    } catch (e) {
      setLoadError(e instanceof AdminApiError ? e.message : 'Could not load users.')
    }
  }, [])

  useEffect(() => {
    if (user && role === 'admin') void load()
  }, [user, role, load])

  if (role && role !== 'admin') {
    return (
      <div className="max-w-xl">
        <h1 className="font-heading text-ink text-2xl md:text-3xl mb-3">Users</h1>
        <p className="text-sm text-muted">Only an admin can manage users. Ask an admin if someone needs access.</p>
      </div>
    )
  }

  const run = async (key: string, action: () => Promise<unknown>, okText: string, onOk?: () => void): Promise<boolean> => {
    setBusy(key)
    setMessage(null)
    try {
      await action()
      onOk?.()
      setMessage({ kind: 'ok', text: okText })
      await load()
      return true
    } catch (e) {
      setMessage({ kind: 'error', text: e instanceof AdminApiError ? e.message : 'Something went wrong.' })
      return false
    } finally {
      setBusy(null)
      setConfirmRemove(null)
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-heading text-ink text-2xl md:text-3xl mb-1">Users</h1>
        <p className="text-sm text-muted">
          Owners can do everything except manage users. Admins can also add, change and remove users.
        </p>
      </div>

      {message && (
        <p role={message.kind === 'error' ? 'alert' : 'status'} className={cn('text-sm rounded px-3 py-2', message.kind === 'error' ? 'bg-clay/10 text-clay' : 'bg-sand text-ink')}>
          {message.text}
        </p>
      )}

      {loadError && (
        <div role="alert" className="space-y-3">
          <p className="text-sm text-ink">{loadError}</p>
          <button onClick={load} className="bg-ink text-paper text-xs uppercase tracking-widest px-5 py-3">
            Retry
          </button>
        </div>
      )}

      {!users && !loadError && (
        <div className="space-y-3 animate-pulse" aria-busy="true">
          {[0, 1].map((i) => (
            <div key={i} className="h-20 bg-sand/70 rounded" />
          ))}
        </div>
      )}

      {users && (
        <ul className="divide-y divide-line border-y border-line" data-testid="user-list">
          {users.map((u) => (
            <li key={u.uid} className="py-4 space-y-3" data-uid={u.uid}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink truncate">
                    {u.email ?? '(no email)'} {u.isYou && <span className="text-xs text-muted font-normal">· you</span>}
                  </p>
                  <p className="text-xs text-muted">
                    {u.signInMethods.map((m) => METHOD_LABEL[m] ?? m).join(' · ') || 'No sign-in method'}
                    {u.roleIsImplicit && ' · role not set (treated as owner)'}
                  </p>
                </div>
                <span className={cn('text-[10px] uppercase tracking-wide px-2 py-1 rounded whitespace-nowrap', u.role === 'admin' ? 'bg-ink text-paper' : 'bg-sand text-ink')}>
                  {u.role}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  disabled={!!busy}
                  onClick={() =>
                    run(
                      `role-${u.uid}`,
                      () => adminFetch(`/api/admin/users/${u.uid}`, { method: 'PATCH', body: JSON.stringify({ role: u.role === 'admin' ? 'owner' : 'admin' }) }),
                      `${u.email} is now ${u.role === 'admin' ? 'an owner' : 'an admin'}.`
                    )
                  }
                  className="border border-line text-xs px-3 py-2.5 disabled:opacity-50"
                >
                  Make {u.role === 'admin' ? 'owner' : 'admin'}
                </button>
                {!u.isYou &&
                  (confirmRemove === u.uid ? (
                    <>
                      <button
                        disabled={!!busy}
                        onClick={() => run(`remove-${u.uid}`, () => adminFetch(`/api/admin/users/${u.uid}`, { method: 'DELETE' }), `${u.email} was removed.`)}
                        className="bg-clay text-paper text-xs px-3 py-2.5 disabled:opacity-50"
                      >
                        Yes, remove {u.email}
                      </button>
                      <button onClick={() => setConfirmRemove(null)} className="text-xs px-3 py-2.5 text-muted">
                        Keep
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setConfirmRemove(u.uid)} className="text-xs px-3 py-2.5 text-clay">
                      Remove
                    </button>
                  ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        className="space-y-3 border border-line rounded p-4"
        onSubmit={(e) => {
          e.preventDefault()
          const target = email.trim()
          void run('add', () => adminFetch('/api/admin/users', { method: 'POST', body: JSON.stringify({ email: target, role: newRole }) }), `${target} was added as ${newRole === 'admin' ? 'an admin' : 'an owner'}.`, () => setEmail(''))
        }}
      >
        <h2 className="text-sm font-semibold text-ink">Add a user</h2>
        <p className="text-xs text-muted">They need a Firebase account first: signing in once at /admin/login with Google is enough.</p>
        <label htmlFor="add-email" className="block text-xs uppercase tracking-widest text-ink/70">
          Email
        </label>
        <input
          id="add-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white border border-line py-3 px-4 text-base focus:outline-none focus:border-ink/40"
        />
        <fieldset className="flex gap-4 text-sm">
          <legend className="sr-only">Role</legend>
          {(['owner', 'admin'] as const).map((r) => (
            <label key={r} className="flex items-center gap-2">
              <input type="radio" name="add-role" id={`add-role-${r}`} checked={newRole === r} onChange={() => setNewRole(r)} />
              {r === 'owner' ? 'Owner' : 'Admin'}
            </label>
          ))}
        </fieldset>
        <button type="submit" disabled={!!busy} className="bg-ink text-paper text-xs uppercase tracking-widest px-5 py-3 disabled:opacity-50">
          {busy === 'add' ? 'Adding…' : 'Add user'}
        </button>
      </form>
    </div>
  )
}
