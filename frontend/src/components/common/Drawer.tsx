import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  width?: 'md' | 'lg' | 'xl';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  width = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthStyles = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl sm:max-w-2xl',
  }[width];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex pl-10 max-w-full">
        <div
          role="dialog"
          aria-modal="true"
          className={`w-screen ${widthStyles} bg-surface border-l border-border p-6 shadow-elevated flex flex-col justify-between overflow-y-auto`}
        >
          <div>
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-border mb-5">
              <div>
                <h2 className="text-lg font-semibold text-text-primary tracking-tight">{title}</h2>
                {description && <p className="text-xs text-text-secondary mt-1">{description}</p>}
              </div>
              <button
                onClick={onClose}
                className="text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-surface-raised transition-colors shrink-0"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
