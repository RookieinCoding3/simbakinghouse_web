'use client'

import { cn } from '@/lib/utils/cn'

interface ProductBadgeProps {
  type: string
  size?: 'sm' | 'md'
}

const BADGE_MAP: Record<string, { label: string; style: string; icon: string }> = {
  'sims-secret': {
    label: "Sim's Secret",
    style: "border-purple-400/20 text-purple-300 bg-purple-950/10",
    icon: "✨"
  },
  'beginner-friendly': {
    label: "Beginner Road",
    style: "border-green-400/20 text-green-300 bg-green-950/10",
    icon: "🌱"
  },
  'sourdough-essential': {
    label: "Artisan Base",
    style: "border-bakery-accent/20 text-bakery-accent bg-bakery-accent/5",
    icon: "🍞"
  },
  'sims-choice': {
    label: "House Choice",
    style: "border-bakery-accent bg-bakery-accent text-bakery-dark font-bold",
    icon: "⭐"
  }
}

export default function ProductBadge({ type, size = 'sm' }: ProductBadgeProps) {
  const config = BADGE_MAP[type] || { label: type, style: "border-white/10 text-white/50 bg-white/5", icon: "•" }

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-sm border backdrop-blur-md px-2 py-0.5 font-heading tracking-[0.2em] uppercase transition-all duration-500",
      size === 'sm' ? "text-[8px]" : "text-[10px]",
      config.style
    )}>
      <span className="opacity-70">{config.icon}</span>
      {config.label}
    </span>
  )
}
