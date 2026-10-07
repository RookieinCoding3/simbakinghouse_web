'use client'

import { senToRMString } from '@/lib/money'

// Till-style price entry: digits shift in from the right, so 1-2-5-0 reads
// RM 12.50. Works by tapping (phone) or typing (the display is focusable and
// takes digits / Backspace). Value is integer sen; never a float.

const MAX_SEN = 9_999_999

interface PriceKeypadProps {
  id: string
  label: string
  valueSen: number | null
  onChange: (sen: number | null) => void
  autoFocus?: boolean
}

export default function PriceKeypad({ id, label, valueSen, onChange, autoFocus }: PriceKeypadProps) {
  const press = (key: string) => {
    const cur = valueSen ?? 0
    if (key === 'back') return onChange(cur < 10 ? null : Math.floor(cur / 10))
    if (key === 'clear') return onChange(null)
    const next = cur * (key === '00' ? 100 : 10) + (key === '00' ? 0 : Number(key))
    if (next <= MAX_SEN) onChange(next)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (/^[0-9]$/.test(e.key)) press(e.key)
    else if (e.key === 'Backspace') press('back')
    else if (e.key === 'Escape' || e.key === 'Delete') press('clear')
    else return
    e.preventDefault()
  }

  return (
    <div className="space-y-2">
      <div
        id={id}
        role="textbox"
        aria-label={label}
        tabIndex={0}
        autoFocus={autoFocus}
        onKeyDown={onKeyDown}
        data-testid={`${id}-display`}
        className="bg-white border border-line py-3 px-4 text-right text-2xl tabular-nums text-ink focus:outline-none focus:border-ink/60"
      >
        <span className="text-muted text-base mr-2">RM</span>
        {senToRMString(valueSen ?? 0)}
      </div>
      <div className="grid grid-cols-3 gap-1.5" role="group" aria-label={`${label} keypad`}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'back'].map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => press(k)}
            aria-label={k === 'back' ? 'Delete last digit' : k}
            className="bg-sand hover:bg-line active:bg-line py-3 text-lg text-ink tabular-nums"
          >
            {k === 'back' ? '⌫' : k}
          </button>
        ))}
      </div>
    </div>
  )
}
