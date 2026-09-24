'use client'

import { useEffect, useState } from 'react'
import { ref, getDownloadURL, getStorage } from 'firebase/storage'
import app from '@/lib/firebase/config'
import { fetchShopSettings, saveShopSettings } from '@/lib/firebase/settings'
import { uploadDuitNowQr } from '@/lib/firebase/storage'
import { normalizeMyPhone } from '@/lib/phone'
import { formatTime } from '@/lib/whatsapp'

const storage = getStorage(app)

function displayTimeTo24h(display: string): string {
  const match = display.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return '06:30'
  const [, hourStr, minute, period] = match
  let hour = Number(hourStr) % 12
  if (period.toUpperCase() === 'PM') hour += 12
  return `${String(hour).padStart(2, '0')}:${minute}`
}

export default function AdminSettingsPage() {
  const [opensAt24, setOpensAt24] = useState('06:30')
  const [closesAt24, setClosesAt24] = useState('13:00')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null)
  const [qrFile, setQrFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchShopSettings().then((settings) => {
      setOpensAt24(displayTimeTo24h(settings.shopOpensAt))
      setClosesAt24(displayTimeTo24h(settings.shopClosesAt))
      setWhatsappNumber(settings.whatsappNumber)
      setLoading(false)
      if (settings.duitNowQrPath) {
        getDownloadURL(ref(storage, settings.duitNowQrPath))
          .then(setQrPreviewUrl)
          .catch(() => {
            // Admin can still be missing storage access briefly right after
            // sign-in — not worth surfacing as an error, just skip the preview.
          })
      }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaved(false)

    const normalizedWhatsapp = normalizeMyPhone(whatsappNumber)
    if (!normalizedWhatsapp) return setError('Enter a valid Malaysian WhatsApp number')

    setSaving(true)
    try {
      const shopOpensAt = formatTime(opensAt24)
      const shopClosesAt = formatTime(closesAt24)

      let duitNowQrPath: string | undefined
      if (qrFile) {
        duitNowQrPath = await uploadDuitNowQr(qrFile)
      }

      await saveShopSettings({
        shopOpensAt,
        shopClosesAt,
        openingHours: `Daily: ${shopOpensAt} - ${shopClosesAt}`,
        whatsappNumber: normalizedWhatsapp,
        ...(duitNowQrPath && { duitNowQrPath }),
      })

      setSaved(true)
      setQrFile(null)
    } catch {
      setError('Could not save. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-muted">Loading…</p>

  return (
    <div>
      <h1 className="font-heading text-ink text-3xl mb-6">Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="opensAt" className="block text-xs uppercase tracking-widest text-ink/70 mb-2">
              Opens
            </label>
            <input
              id="opensAt"
              type="time"
              value={opensAt24}
              onChange={(e) => setOpensAt24(e.target.value)}
              required
              className="w-full bg-white border border-line py-3 px-4 text-ink text-sm focus:outline-none focus:border-ink/40"
            />
          </div>
          <div>
            <label htmlFor="closesAt" className="block text-xs uppercase tracking-widest text-ink/70 mb-2">
              Closes
            </label>
            <input
              id="closesAt"
              type="time"
              value={closesAt24}
              onChange={(e) => setClosesAt24(e.target.value)}
              required
              className="w-full bg-white border border-line py-3 px-4 text-ink text-sm focus:outline-none focus:border-ink/40"
            />
          </div>
        </div>
        <p className="text-[11px] text-muted -mt-4">Same hours every day (the site doesn&apos;t support different hours per day yet).</p>

        <div>
          <label htmlFor="whatsapp" className="block text-xs uppercase tracking-widest text-ink/70 mb-2">
            WhatsApp number
          </label>
          <input
            id="whatsapp"
            type="tel"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="012-345 6789"
            required
            className="w-full bg-white border border-line py-3 px-4 text-ink text-sm focus:outline-none focus:border-ink/40"
          />
        </div>

        <div>
          <label htmlFor="qr" className="block text-xs uppercase tracking-widest text-ink/70 mb-2">
            DuitNow payment QR
          </label>
          {qrPreviewUrl && !qrFile && (
            // eslint-disable-next-line @next/next/no-img-element -- admin-only preview of a private, signed-in-only Storage file
            <img src={qrPreviewUrl} alt="Current DuitNow QR" className="w-32 h-32 object-contain border border-line mb-2" />
          )}
          <input
            id="qr"
            type="file"
            accept="image/*"
            onChange={(e) => setQrFile(e.target.files?.[0] ?? null)}
            className="text-sm text-ink"
          />
          <p className="text-[11px] text-muted mt-1">Never shown publicly — only on a confirmed order&apos;s status page.</p>
        </div>

        {error && <p className="text-xs text-clay">{error}</p>}
        {saved && <p className="text-xs text-clay">Saved.</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-ink hover:bg-clay disabled:opacity-50 text-paper py-4 font-body font-medium text-xs uppercase tracking-[0.2em] transition-colors"
        >
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </form>
    </div>
  )
}
