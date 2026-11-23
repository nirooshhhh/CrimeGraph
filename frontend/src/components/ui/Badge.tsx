import React from 'react'
import { cn } from '../../lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'amber' | 'teal' | 'red' | 'green' | 'blue' | 'purple' | 'gray' | 'default'
  size?: 'sm' | 'md'
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className,
  ...props
}) => {
  const variantStyles = {
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    teal: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
    red: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    blue: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    gray: 'bg-slate-700/30 text-slate-300 border-slate-700',
    default: 'bg-bg-elevated text-text-secondary border-border-subtle',
  }

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 rounded-full',
    md: 'text-xs px-2.5 py-1 rounded-md font-medium',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border font-mono tracking-tight',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
