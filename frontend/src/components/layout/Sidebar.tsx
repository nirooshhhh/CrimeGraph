import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Layers,
  PhoneCall,
  ArrowLeftRight,
  FileText,
  Users,
  GitCompare,
  Network,
  Share2,
  BellRing,
  ShieldAlert,
  Shield,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

interface NavModule {
  number: string;
  title: string;
  items: NavItem[];
}

const navModules: NavModule[] = [
  {
    number: '01',
    title: 'Dashboard',
    items: [{ name: 'Dashboard', path: '/', icon: LayoutDashboard }],
  },
  {
    number: '02',
    title: 'Case Management',
    items: [
      { name: 'Investigations', path: '/cases', icon: Briefcase },
      { name: 'Sources', path: '/sources', icon: Layers },
      { name: 'Call Records', path: '/call-records', icon: PhoneCall },
      { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
    ],
  },
  {
    number: '03',
    title: 'Document Intelligence',
    items: [{ name: 'Documents', path: '/documents', icon: FileText }],
  },
  {
    number: '04',
    title: 'Entity Matching',
    items: [
      { name: 'Entities', path: '/entities', icon: Users },
      { name: 'Match Review', path: '/match-review', icon: GitCompare },
    ],
  },
  {
    number: '05',
    title: 'Network Explorer',
    items: [
      { name: 'Link Analysis', path: '/graph', icon: Network },
      { name: 'Relationships', path: '/relationships', icon: Share2 },
    ],
  },
  {
    number: '06',
    title: 'Alerts & Analytics',
    items: [{ name: 'Alerts', path: '/alerts', icon: BellRing }],
  },
  {
    number: '07',
    title: 'Audit & Administration',
    items: [{ name: 'Audit Logs', path: '/audit-logs', icon: ShieldAlert }],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[260px] bg-surface border-r border-border flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo */}
        <div className="h-16 px-5 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-text-primary flex items-center gap-1.5">
                CrimeGraph
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-surface-raised border border-border text-accent">
                  INTEL
                </span>
              </div>
              <div className="text-[11px] text-text-muted">Investigation Platform</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-raised"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modules List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navModules.map((mod) => (
            <div key={mod.number} className="space-y-1">
              {/* Group Heading */}
              <div className="px-3 pb-1 flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase text-text-muted select-none">
                <span className="text-accent/70 font-mono text-[10px]">{mod.number}</span>
                <span>{mod.title}</span>
              </div>

              {/* Items indented under group */}
              <div className="space-y-0.5">
                {mod.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/'}
                      onClick={() => onClose()}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                          isActive
                            ? 'bg-accent/15 text-accent border border-accent/25 font-semibold'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised/70 border border-transparent'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border shrink-0">
          <div className="px-3 py-2 rounded-lg bg-surface-raised/50 border border-border-subtle flex items-center justify-between text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-accent" />
              <span>Analyst Mode</span>
            </span>
            <span className="font-mono text-[10px] text-text-muted">v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};
