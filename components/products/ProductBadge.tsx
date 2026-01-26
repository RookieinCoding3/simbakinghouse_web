'use client'

import { cn } from '@/lib/utils/cn'

interface ProductBadgeProps {
  type: string
  size?: 'sm' | 'md'
}

const BADGE_MAP: Record<string, { label: string; style: string }> = {
  'sims-secret': {
    label: "Sim's Secret",
    style: "bg-purple-500/10 text-purple-300 border-purple-500/20"
  },
  'beginner-friendly': {
    label: "Beginner Friendly",
    style: "bg-green-500/10 text-green-300 border-green-500/20"
  },
  'sourdough-essential': {
    label: "Sourdough Essential",
    style: "bg-bakery-accent/10 text-bakery-accent border-bakery-accent/20"
  },
  'sims-choice': {
    label: "Sim's Choice",
    style: "bg-bakery-accent text-bakery-dark border-bakery-accent shadow-[0_0_15px_rgba(212,165,116,0.3)]"
  }
}

export default function ProductBadge({ type, size = 'sm' }: ProductBadgeProps) {
  const config = BADGE_MAP[type] || { label: type, style: "bg-white/10 text-white border-white/20" }

  return (
    <span className={cn(
      "inline-flex items-center justify-center rounded-full border backdrop-blur-md font-heading tracking-widest uppercase animate-fade-in",
      size === 'sm' ? "px-2 py-0.5 text-[8px]" : "px-3 py-1 text-[10px]",
      config.style
    )}>
      {config.label}
    </span>
  )
}
