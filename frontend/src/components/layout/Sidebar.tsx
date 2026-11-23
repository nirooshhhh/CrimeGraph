import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  Users,
  GitCompare,
  Network,
  Route,
  ShieldAlert,
  PhoneCall,
  ArrowLeftRight,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Binary,
} from 'lucide-react'
import { cn } from '../../lib/utils'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  alertCount?: number
  matchCount?: number
}

interface NavGroup {
  group: string
  items: Array<{
    label: string
    to: string
    icon: React.ElementType
    badge?: number | string
    badgeVariant?: 'amber' | 'red' | 'blue'
  }>
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggle,
  alertCount = 4,
  matchCount = 3,
}) => {
  const navigationGroups: NavGroup[] = [
    {
      group: 'Investigation Core',
      items: [
        { label: 'Overview', to: '/overview', icon: LayoutDashboard },
        { label: 'Investigations', to: '/investigations', icon: FolderOpen },
        { label: 'Evidence & Documents', to: '/documents', icon: FileText },
        { label: 'Entities', to: '/entities', icon: Users },
      ],
    },
    {
      group: 'Network & Analysis',
      items: [
        { label: 'Link Analysis', to: '/link-analysis', icon: Network },
        { label: 'Shortest Path', to: '/shortest-path', icon: Route },
        {
          label: 'Entity Match Review',
          to: '/entity-matches',
          icon: GitCompare,
          badge: matchCount > 0 ? matchCount : undefined,
          badgeVariant: 'amber',
        },
      ],
    },
    {
      group: 'Surveillance & Records',
      items: [
        {
          label: 'Alerts',
          to: '/alerts',
          icon: ShieldAlert,
          badge: alertCount > 0 ? alertCount : undefined,
          badgeVariant: 'red',
        },
        { label: 'Call Records', to: '/call-records', icon: PhoneCall },
        { label: 'Transactions', to: '/transactions', icon: ArrowLeftRight },
      ],
    },
    {
      group: 'System & Auditing',
      items: [
        { label: 'Activity Logs', to: '/activity-logs', icon: ScrollText },
        { label: 'Settings', to: '/settings', icon: Settings },
      ],
    },
  ]

  return (
    <aside
      className={cn(
        'relative flex flex-col bg-bg-secondary border-r border-border-subtle flex-shrink-0 transition-all duration-200 z-30 select-none h-screen',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border-subtle bg-bg-secondary/70">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-amber-forensic to-amber-dim flex items-center justify-center shadow-glow-amber">
          <Binary className="w-5 h-5 text-bg-primary stroke-[2.5]" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-wider text-text-primary uppercase font-mono">
                CRIME<span className="text-amber-forensic">GRAPH</span>
              </span>
              <span className="text-[9px] px-1 py-0.2 rounded font-mono bg-amber-forensic/20 text-amber-forensic border border-amber-forensic/30">
                v2.4
              </span>
            </div>
            <p className="text-[10px] text-text-muted truncate font-mono">
              Every clue has a connection.
            </p>
          </div>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
        {navigationGroups.map((grp, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!collapsed && (
              <p className="px-3 pb-1 text-[10px] font-semibold font-mono tracking-wider text-text-muted uppercase">
                {grp.group}
              </p>
            )}
            {grp.items.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                      isActive
                        ? 'bg-amber-forensic/15 text-amber-forensic border border-amber-forensic/30 shadow-sm font-semibold'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated/70'
                    )
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110" />
                  {!collapsed && (
                    <span className="truncate flex-1 tracking-tight">{item.label}</span>
                  )}
                  {!collapsed && item.badge && (
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold leading-none',
                        item.badgeVariant === 'red'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </div>
        ))}
      </div>

      {/* User / Unit Designation Footer */}
      <div className="p-3 border-t border-border-subtle bg-bg-elevated/20">
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-bg-elevated/60 border border-border-subtle mb-2">
            <div className="w-7 h-7 rounded-md bg-teal-forensic/20 border border-teal-forensic/30 flex items-center justify-center text-teal-400 font-mono text-xs font-bold flex-shrink-0">
              ISE
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-text-primary truncate">Dept. Info Science</p>
              <p className="text-[10px] text-text-muted truncate font-mono">Forensic Analyst Node</p>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors border border-transparent hover:border-border-subtle"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  )
}
