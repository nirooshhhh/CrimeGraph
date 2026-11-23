import React from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingStateProps {
  message?: string
  subMessage?: string
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading investigative data...',
  subMessage = 'Querying criminal network intelligence gateway',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-16 text-center">
      <div className="relative mb-4">
        <div className="w-12 h-12 rounded-full border-2 border-border-subtle border-t-amber-forensic animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-amber-forensic/80 animate-pulse" />
        </div>
      </div>
      <p className="text-sm font-medium text-text-primary mb-1">{message}</p>
      {subMessage && <p className="text-xs text-text-muted">{subMessage}</p>}
    </div>
  )
}
