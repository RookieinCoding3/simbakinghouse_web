'use client'

import { cn } from '@/lib/utils/cn'

interface ProductBadgeProps {
  type: string
  size?: 'sm' | 'md'
}

// 'sims-secret' ("✨ SECRET") deliberately removed: it never had a real
// theme behind it, and per the owner's own rule, an unexplained badge gets
// deleted rather than have a meaning invented for it to justify keeping it.
const BADGE_MAP: Record<string, { label: string; color: string; icon: string }> = {
  'beginner-friendly': { label: "BEGINNER", color: "text-clay", icon: "🌱" },
  'sourdough-essential': { label: "ARTISAN", color: "text-clay", icon: "🍞" },
  'sims-choice': { label: "SIM'S CHOICE", color: "text-clay", icon: "⭐" }
}

export default function ProductBadge({ type, size = 'sm' }: ProductBadgeProps) {
  const config = BADGE_MAP[type] || { label: type, color: "text-ink/50", icon: "•" }

  return (
    <span className={cn(
      "inline-flex items-center gap-1 font-body font-semibold tracking-[0.25em] uppercase transition-all duration-500",
      size === 'sm' ? "text-[7px]" : "text-[9px]",
      config.color
    )}>
      <span className="opacity-80">{config.icon}</span>
      {config.label}
    </span>
  )
}
