'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth, adminSignIn } from '@/lib/firebase/auth'
import { useAdminSession } from '@/lib/admin/AdminSession'

function safeNext(): string {
  try {
    const next = new URLSearchParams(window.location.search).get('next')
    // Only ever an admin path on this site — never an open redirect.
    if (next && next.startsWith('/admin') && !next.startsWith('//')) return next
  } catch {}
  return '/admin'
}

export default function AdminLoginPage() {
  const router = useRouter()
  const session = useAdminSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (session.phase === 'admin') router.replace(safeNext())
  }, [session.phase, router])

  const begin = () => {
    setError(null)
    session.clearRejected()
    setBusy(true)
  }

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    begin()
    try {
      await adminSignIn(email, password)
    } catch {
      setError('Wrong email or password.')
    } finally {
      setBusy(false)
    }
  }

  const handleGoogle = async () => {
    begin()
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
    } catch (err) {
      const code = (err as { code?: string }).code
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setError('Google sign-in did not complete. Try again, or use email and password.')
      }
    } finally {
      setBusy(false)
    }
  }

  const checking = session.phase === 'checking' || (session.phase === 'admin' && !error)

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="font-heading text-ink text-3xl">SBH Admin</h1>
          <p className="text-xs text-muted mt-1">Staff sign-in</p>
        </div>

        {session.rejected && (
          <div role="alert" className="border border-clay/40 bg-clay/5 rounded p-4 space-y-2">
            <p className="text-sm text-ink font-medium">This account is not an admin.</p>
            {session.rejected.email && <p className="text-xs text-muted">{session.rejected.email}</p>}
            <p className="text-xs text-muted">Ask the owner to add this ID:</p>
            <p className="font-mono text-xs bg-white border border-line px-3 py-2 break-all select-all" data-testid="rejected-uid">
              {session.rejected.uid}
            </p>
            <p className="text-xs text-muted">You have been signed out.</p>
          </div>
        )}

        {checking ? (
          <p className="text-sm text-muted text-center py-8" aria-live="polite">
            Checking access…
          </p>
        ) : (
          <>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={busy}
              className="w-full flex items-center justify-center gap-3 bg-white border border-line hover:border-ink/40 py-3.5 text-sm font-medium disabled:opacity-50"
            >
              <GoogleMark />
              Sign in with Google
            </button>

            <div className="flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted">
              <span className="flex-1 h-px bg-line" />
              or
              <span className="flex-1 h-px bg-line" />
            </div>

            <form onSubmit={handleEmail} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs uppercase tracking-widest text-ink/70 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                  className="w-full bg-white border border-line py-3 px-4 text-base focus:outline-none focus:border-ink/40"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-xs uppercase tracking-widest text-ink/70 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full bg-white border border-line py-3 px-4 text-base focus:outline-none focus:border-ink/40"
                />
              </div>
              {error && <p className="text-xs text-clay">{error}</p>}
              <button
                type="submit"
                disabled={busy}
                className="w-full bg-ink hover:bg-clay disabled:opacity-50 text-paper py-4 font-medium text-xs uppercase tracking-[0.2em] transition-colors"
              >
                {busy ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </>
        )}

        <p className="text-center">
          <Link href="/" prefetch={false} className="text-xs text-muted hover:text-ink">
            &larr; Back to the shop
          </Link>
        </p>
      </div>
    </main>
  )
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="w-5 h-5" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}
