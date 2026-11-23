import React from 'react'
import { AlertCircle, CheckCircle2, RefreshCw, Database } from 'lucide-react'
import { Button } from './Button'

interface StatusBannerProps {
  isLive: boolean
  isChecking?: boolean
  error?: string | null
  onRetry?: () => void
  usingDemoFallback?: boolean
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
  isLive,
  isChecking = false,
  error,
  onRetry,
  usingDemoFallback = false,
}) => {
  if (isLive) {
    return (
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-emerald-500/10 border-b border-emerald-500/20 text-xs text-emerald-300">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-mono">
            API GATEWAY CONNECTED (http://localhost:5000)
          </span>
        </div>
        <span className="text-[11px] text-emerald-400/80 font-mono">LIVE INTELLIGENCE STREAM</span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between px-3.5 py-2 bg-amber-500/10 border-b border-amber-500/25 text-xs text-amber-200">
      <div className="flex items-center gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <div>
          <span className="font-semibold text-amber-300 mr-2 font-mono">
            BACKEND OFFLINE / DEMO REPOSITORY ACTIVE
          </span>
          <span className="text-amber-200/80 text-[11px]">
            {error || 'API Gateway unreachable at http://localhost:5000. Displaying synthetic academic demonstration data.'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {usingDemoFallback && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-bg-secondary text-[11px] font-mono text-amber-300 border border-amber-500/30">
            <Database className="w-3 h-3 text-amber-400" />
            SYNTHETIC DATA
          </span>
        )}
        {onRetry && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onRetry}
            isLoading={isChecking}
            icon={<RefreshCw className="w-3 h-3 text-amber-400" />}
            className="text-amber-300 hover:text-amber-100 hover:bg-amber-500/20 text-xs py-1 px-2"
          >
            Retry Connection
          </Button>
        )}
      </div>
    </div>
  )
}
