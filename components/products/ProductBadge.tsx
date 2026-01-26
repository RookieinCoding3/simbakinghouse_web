'use client'

import { cn } from '@/lib/utils/cn'

interface ProductBadgeProps {
  type: string
  size?: 'sm' | 'md'
}

const BADGE_MAP: Record<string, { label: string; color: string; icon: string }> = {
  'sims-secret': { label: "SECRET", color: "text-purple-400", icon: "✨" },
  'beginner-friendly': { label: "BEGINNER", color: "text-green-400", icon: "🌱" },
  'sourdough-essential': { label: "ARTISAN", color: "text-bakery-accent", icon: "🍞" },
  'sims-choice': { label: "SIM'S CHOICE", color: "text-bakery-accent", icon: "⭐" }
}

export default function ProductBadge({ type, size = 'sm' }: ProductBadgeProps) {
  const config = BADGE_MAP[type] || { label: type, color: "text-white/50", icon: "•" }

  return (
    <span className={cn(
      "inline-flex items-center gap-1 font-heading tracking-[0.25em] uppercase transition-all duration-500",
      size === 'sm' ? "text-[7px]" : "text-[9px]",
      config.color
    )}>
      <span className="opacity-80">{config.icon}</span>
      {config.label}
    </span>
  )
}
