'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'
import AuthModal from './AuthModal'

export default function AccountButton() {
  const { user, loading } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)

  if (loading) {
    return <span className="w-11 h-11 inline-block" aria-hidden="true" />
  }

  if (user) {
    return (
      <Link
        href="/account"
        className="w-11 h-11 flex items-center justify-center text-ink hover:text-clay transition-colors"
        aria-label="Your account"
      >
        <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c0-3.5 3.5-6 8-6s8 2.5 8 6" />
        </svg>
      </Link>
    )
  }

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="w-11 h-11 flex items-center justify-center text-ink hover:text-clay transition-colors"
        aria-label="Sign in"
      >
        <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c0-3.5 3.5-6 8-6s8 2.5 8 6" />
        </svg>
      </button>
      <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
