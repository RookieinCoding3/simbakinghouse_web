'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'
import { detectInAppBrowser, isBlockedUserAgentError } from '@/lib/utils/inAppBrowser'
import Button from '@/components/ui/Button'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

type Mode = 'signin' | 'signup' | 'forgot'

function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists — try signing in instead.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.'
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.'
    case 'auth/invalid-email':
      return 'Enter a valid email address.'
    case 'auth/popup-closed-by-user':
      return ''
    default:
      return 'Something went wrong, please try again.'
  }
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, sendPasswordReset } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [resetSent, setResetSent] = useState(false)
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [inAppBrowser, setInAppBrowser] = useState<string | null>(null)

  useEffect(() => {
    const { isInApp, appName } = detectInAppBrowser(navigator.userAgent)
    setInAppBrowser(isInApp ? appName : null)
  }, [])
  // createPortal needs document.body, which doesn't exist during SSR. Also
  // means this modal is safe to mount anywhere (e.g. inside Header, which
  // has backdrop-blur — that makes it a containing block for any
  // position:fixed descendant, collapsing one down to the header's own
  // height, same bug as the mobile nav panel had).
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Reset form state each time the modal is reopened.
  useEffect(() => {
    if (isOpen) {
      setEmail('')
      setPassword('')
      setError(null)
      setResetSent(false)
      setConsent(false)
      setMode('signin')
    }
  }, [isOpen])

  if (!isOpen || !mounted) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (mode === 'signup' && !consent) {
      setError('Agree to the Privacy Notice and Terms of Sale to create an account')
      return
    }
    setSubmitting(true)
    try {
      if (mode === 'forgot') {
        try {
          await sendPasswordReset(email)
        } catch (err) {
          // Never reveal whether an account exists for this email — show
          // the same "sent" state regardless, and only surface a real
          // error for something actually actionable (a malformed address
          // or rate limiting). Firebase's own email-enumeration-protection
          // setting already does this for newer projects; this covers
          // projects where that's off too.
          const code = (err as { code?: string })?.code
          if (code !== 'auth/invalid-email' && code !== 'auth/too-many-requests') {
            setResetSent(true)
            return
          }
          throw err
        }
        setResetSent(true)
      } else if (mode === 'signin') {
        await signInWithEmail(email, password)
        onClose()
      } else {
        await signUpWithEmail(email, password)
        onClose()
      }
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogle = async () => {
    setError(null)
    if (mode === 'signup' && !consent) {
      setError('Agree to the Privacy Notice and Terms of Sale to create an account')
      return
    }
    setSubmitting(true)
    try {
      await signInWithGoogle()
      onClose()
    } catch (err) {
      if (isBlockedUserAgentError(err)) {
        // The proactive UA check (inAppBrowser) didn't catch this one —
        // likely iOS, where these apps' WebViews often don't self-identify
        // — but Google's own error confirms it. Same message either way.
        setInAppBrowser((current) => current ?? 'this app')
        return
      }
      const message = authErrorMessage(err)
      if (message) setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close dialog"
      />

      <div className="relative bg-paper shadow-2xl max-w-sm w-full p-6 sm:p-8 animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center text-ink hover:text-clay transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="font-heading text-ink text-3xl mb-1">
          {mode === 'signin' && 'Sign in'}
          {mode === 'signup' && 'Create account'}
          {mode === 'forgot' && 'Reset password'}
        </h2>
        <p className="text-ink/60 text-sm mb-6">
          {mode === 'signin' && 'Your cart and orders follow you across devices.'}
          {mode === 'signup' && 'Takes a few seconds — no need unless you want it.'}
          {mode === 'forgot' && "We'll email you a link to set a new password."}
        </p>

        {mode === 'forgot' && resetSent ? (
          <p className="text-sm text-ink">
            If an account exists for <span className="font-medium">{email}</span>, a reset link is
            on its way.
          </p>
        ) : (
          <>
            {mode !== 'forgot' &&
              (inAppBrowser ? (
                <div className="border border-line bg-sand px-4 py-3 text-sm text-ink/70 mb-5">
                  Open this page in Safari or Chrome to continue with Google — {inAppBrowser}&apos;s
                  built-in browser blocks it. Email sign-in below still works here.
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleGoogle}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-3 border border-line py-3 text-sm font-medium text-ink hover:border-ink transition-colors disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.52 12.27c0-.85-.07-1.47-.22-2.12H12v3.85h6.6c-.13 1.1-.86 2.76-2.47 3.87l-.02.15 3.59 2.78.25.02c2.28-2.1 3.57-5.2 3.57-8.55" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.79-2.94c-1.02.7-2.4 1.19-4.16 1.19-3.18 0-5.88-2.1-6.84-5.01l-.14.01-3.73 2.9-.05.14C3.25 21.34 7.3 24 12 24" />
                      <path fill="#FBBC05" d="M5.16 14.34a7.5 7.5 0 0 1-.4-2.34c0-.82.14-1.6.39-2.34l-.01-.16-3.78-2.94-.12.06A11.98 11.98 0 0 0 0 12c0 1.93.47 3.76 1.24 5.38l3.92-3.04" />
                      <path fill="#EA4335" d="M12 4.75c2.26 0 3.78.97 4.65 1.79l3.4-3.32C17.94 1.19 15.24 0 12 0 7.3 0 3.25 2.66 1.24 6.62l3.91 3.04c.97-2.91 3.67-5.01 6.85-5.01" />
                    </svg>
                    Continue with Google
                  </button>

                  <div className="flex items-center gap-3 my-5">
                    <div className="h-px flex-1 bg-line" />
                    <span className="text-[10px] uppercase tracking-widest text-ink/40">or</span>
                    <div className="h-px flex-1 bg-line" />
                  </div>
                </>
              ))}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="auth-email" className="block text-xs uppercase tracking-wide text-ink/60 mb-1.5">
                  Email
                </label>
                <input
                  id="auth-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-line px-4 py-3 text-base text-ink focus:border-ink outline-none"
                />
              </div>

              {mode !== 'forgot' && (
                <div>
                  <label htmlFor="auth-password" className="block text-xs uppercase tracking-wide text-ink/60 mb-1.5">
                    Password
                  </label>
                  <input
                    id="auth-password"
                    type="password"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-line px-4 py-3 text-base text-ink focus:border-ink outline-none"
                  />
                </div>
              )}

              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot')
                    setError(null)
                  }}
                  className="text-sm text-ink/60 hover:text-ink underline underline-offset-2"
                >
                  Forgot password?
                </button>
              )}

              {mode === 'signup' && (
                <label className="flex items-start gap-3 text-sm text-ink/70">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5"
                    required
                  />
                  <span>
                    I agree to the{' '}
                    <Link href="/privacy" prefetch={false} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink">
                      Privacy Notice
                    </Link>{' '}
                    and{' '}
                    <Link href="/terms" prefetch={false} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink">
                      Terms of Sale
                    </Link>
                    .
                  </span>
                </label>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={submitting}>
                {mode === 'signin' && 'Sign in'}
                {mode === 'signup' && 'Create account'}
                {mode === 'forgot' && 'Send reset link'}
              </Button>
            </form>
          </>
        )}

        {mode === 'forgot' ? (
          <button
            type="button"
            onClick={() => {
              setMode('signin')
              setError(null)
              setResetSent(false)
            }}
            className="mt-5 text-sm text-ink/60 hover:text-ink underline underline-offset-2"
          >
            Back to sign in
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
              setError(null)
            }}
            className="mt-5 text-sm text-ink/60 hover:text-ink underline underline-offset-2"
          >
            {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        )}
      </div>
    </div>,
    document.body
  )
}
