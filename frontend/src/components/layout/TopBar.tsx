import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { Menu, Activity, RefreshCw } from 'lucide-react';
import { fetchHealth } from '../../api';

interface TopBarProps {
  onOpenSidebar: () => void;
}

const getPageTitle = (pathname: string): { title: string; moduleName: string } => {
  if (pathname === '/' || pathname === '/dashboard') {
    return { title: 'Dashboard', moduleName: '01 Dashboard' };
  }
  if (pathname.startsWith('/cases')) {
    if (pathname.includes('/graph')) {
      return { title: 'Case Link Analysis', moduleName: '05 Network Explorer' };
    }
    if (pathname !== '/cases') {
      return { title: 'Investigation Detail', moduleName: '02 Case Management' };
    }
    return { title: 'Investigations', moduleName: '02 Case Management' };
  }
  if (pathname.startsWith('/sources')) {
    return { title: 'Information Sources', moduleName: '02 Case Management' };
  }
  if (pathname.startsWith('/call-records')) {
    return { title: 'Call Detail Records', moduleName: '02 Case Management' };
  }
  if (pathname.startsWith('/transactions')) {
    return { title: 'Financial Transactions', moduleName: '02 Case Management' };
  }
  if (pathname.startsWith('/documents')) {
    if (pathname !== '/documents') {
      return { title: 'Document Detail & Mentions', moduleName: '03 Document Intelligence' };
    }
    return { title: 'Document Intelligence', moduleName: '03 Document Intelligence' };
  }
  if (pathname.startsWith('/entities')) {
    if (pathname !== '/entities') {
      return { title: 'Entity Profile', moduleName: '04 Entity Matching' };
    }
    return { title: 'Entities Repository', moduleName: '04 Entity Matching' };
  }
  if (pathname.startsWith('/match-review')) {
    return { title: 'Entity Match Review', moduleName: '04 Entity Matching' };
  }
  if (pathname.startsWith('/graph')) {
    return { title: 'Network Link Analysis', moduleName: '05 Network Explorer' };
  }
  if (pathname.startsWith('/relationships')) {
    return { title: 'Entity Relationships', moduleName: '05 Network Explorer' };
  }
  if (pathname.startsWith('/alerts')) {
    return { title: 'Alerts & Network Metrics', moduleName: '06 Alerts & Analytics' };
  }
  if (pathname.startsWith('/audit-logs')) {
    return { title: 'Audit Trail Logs', moduleName: '07 Audit & Administration' };
  }
  return { title: 'CrimeGraph Intel', moduleName: 'Investigation Platform' };
};

export const TopBar: React.FC<TopBarProps> = ({ onOpenSidebar }) => {
  const location = useLocation();
  const { title, moduleName } = getPageTitle(location.pathname);

  const { data: health, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 30000,
  });

  const isHealthy = health?.success && health?.status === 'OK';

  return (
    <header className="sticky top-0 z-30 h-16 bg-surface/90 backdrop-blur-md border-b border-border px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="text-[11px] font-mono text-text-muted">{moduleName}</div>
          <h1 className="text-lg font-semibold text-text-primary tracking-tight">{title}</h1>
        </div>
      </div>

      {/* Backend Connection Status (GET /health per prompt) */}
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
            isError
              ? 'bg-status-error/10 border-status-error/30 text-status-error'
              : isHealthy
              ? 'bg-status-success/10 border-status-success/30 text-status-success'
              : 'bg-surface-raised border-border text-text-muted'
          }`}
          title={isError ? 'Gateway disconnected' : isHealthy ? health?.message : 'Checking gateway...'}
        >
          <span className="relative flex h-2 w-2">
            {isHealthy && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isError ? 'bg-status-error' : isHealthy ? 'bg-status-success' : 'bg-text-muted'
              }`}
            />
          </span>
          <span className="hidden sm:inline">
            {isLoading
              ? 'Connecting...'
              : isError
              ? 'Gateway Down'
              : 'Gateway Online'}
          </span>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-0.5 text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
            title="Refresh backend connection status"
            aria-label="Refresh health check"
          >
            <RefreshCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
