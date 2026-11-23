import React from 'react'
import { cn } from '../../lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: 'amber' | 'teal' | 'none'
  interactive?: boolean
}

export const Card: React.FC<CardProps> = ({
  children,
  glow = 'none',
  interactive = false,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-bg-secondary border border-border-subtle rounded-xl p-5 transition-all duration-200',
        interactive && 'hover:border-border-strong hover:bg-bg-secondary/90 cursor-pointer',
        glow === 'amber' && 'hover:shadow-glow-amber hover:border-amber-forensic/40',
        glow === 'teal' && 'hover:shadow-glow-teal hover:border-teal-forensic/40',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
