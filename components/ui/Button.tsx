'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonProps) {
  const baseStyles =
    'font-heading tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

  const variantStyles = {
    primary:
      'bg-bakery-accent hover:bg-bakery-accent/90 text-bakery-brown font-bold shadow-lg hover:shadow-xl',
    secondary:
      'bg-bakery-cream hover:bg-bakery-cream/90 text-bakery-brown font-bold shadow-md hover:shadow-lg',
    outline:
      'bg-transparent border-2 border-bakery-cream text-bakery-cream hover:bg-bakery-cream hover:text-bakery-brown font-bold',
  }

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        'rounded-lg',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
