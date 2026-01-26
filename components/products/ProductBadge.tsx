'use client'

import { memo } from 'react'

interface ProductBadgeProps {
  type: string
  size?: 'sm' | 'md' | 'lg'
}

const BADGE_CONFIG: Record<string, { label: string; bgColor: string; textColor: string }> = {
  'sims-secret': {
    label: "Sim's Secret",
    bgColor: 'bg-purple-900/90',
    textColor: 'text-purple-200',
  },
  'beginner-friendly': {
    label: 'Beginner Friendly',
    bgColor: 'bg-green-900/90',
    textColor: 'text-green-200',
  },
  'sourdough-essential': {
    label: 'Sourdough Essential',
    bgColor: 'bg-bakery-accent/90',
    textColor: 'text-bakery-dark',
  },
  'sims-choice': {
    label: "Sim's Choice",
    bgColor: 'bg-bakery-accent',
    textColor: 'text-bakery-dark',
  },
}

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-[9px]',
  md: 'px-3 py-1 text-[10px]',
  lg: 'px-4 py-1.5 text-xs',
}

function ProductBadge({ type, size = 'md' }: ProductBadgeProps) {
  const config = BADGE_CONFIG[type]

  if (!config) return null

  return (
    <span
      className={`
        inline-block font-heading uppercase tracking-wider backdrop-blur-sm
        ${config.bgColor} ${config.textColor} ${SIZE_CLASSES[size]}
      `}
    >
      {config.label}
    </span>
  )
}

export default memo(ProductBadge)
