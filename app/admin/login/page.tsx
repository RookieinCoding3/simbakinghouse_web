'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminSignIn } from '@/lib/firebase/auth'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await adminSignIn(email, password)
      router.push('/admin')
    } catch {
      setError('Wrong email or password')
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-paper flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
        <h1 className="font-heading text-ink text-3xl text-center mb-4">Admin</h1>

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
            className="w-full bg-white border border-line py-3 px-4 text-ink text-sm focus:outline-none focus:border-ink/40"
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
            className="w-full bg-white border border-line py-3 px-4 text-ink text-sm focus:outline-none focus:border-ink/40"
          />
        </div>

        {error && <p className="text-xs text-clay">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-ink hover:bg-clay disabled:opacity-50 text-paper py-4 font-body font-medium text-xs uppercase tracking-[0.2em] transition-colors"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}
