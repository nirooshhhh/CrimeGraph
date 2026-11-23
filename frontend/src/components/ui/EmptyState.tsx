import React from 'react'
import { FolderSearch, Plus } from 'lucide-react'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border-subtle rounded-xl bg-bg-secondary/40">
      <div className="w-12 h-12 rounded-xl bg-bg-elevated border border-border flex items-center justify-center text-text-muted mb-4">
        {icon || <FolderSearch className="w-6 h-6 text-amber-forensic/70" />}
      </div>
      <h4 className="text-base font-semibold text-text-primary mb-1.5">{title}</h4>
      <p className="text-xs text-text-muted max-w-sm mb-6 leading-relaxed">{description}</p>
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex items-center gap-3">
          {actionLabel && onAction && (
            <Button variant="primary" size="sm" onClick={onAction} icon={<Plus className="w-4 h-4" />}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="secondary" size="sm" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
