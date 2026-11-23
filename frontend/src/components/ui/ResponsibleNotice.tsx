import React from 'react'
import { AlertTriangle, ShieldCheck } from 'lucide-react'

interface ResponsibleNoticeProps {
  compact?: boolean
  className?: string
}

export const ResponsibleNotice: React.FC<ResponsibleNoticeProps> = ({
  compact = false,
  className = '',
}) => {
  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 ${className}`}
      >
        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
        <span className="font-mono">
          SUPPORT TOOL: Findings require independent human verification. Never determines legal guilt.
        </span>
      </div>
    )
  }

  return (
    <div
      className={`flex items-start gap-3 p-3.5 rounded-xl bg-bg-elevated/70 border border-border-subtle text-xs text-text-secondary ${className}`}
    >
      <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0">
        <ShieldCheck className="w-4 h-4" />
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-text-primary tracking-wide">
            INVESTIGATIVE INTELLIGENCE ASSISTANT
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-bg-secondary text-text-muted border border-border-subtle">
            HUMAN-IN-THE-LOOP
          </span>
        </div>
        <p className="leading-relaxed">
          CrimeGraph identifies structural correlations and data linkages across disparate records. Extracted entities,
          similarity candidates, and graph paths are investigative leads and must not be interpreted as definitive proof of
          criminal liability or verified culpability.
        </p>
      </div>
    </div>
  )
}
