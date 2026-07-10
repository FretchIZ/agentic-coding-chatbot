'use client';

import { useTheme } from '@/components/theme-provider';
import ThemeToggle from '@/components/theme-toggle';
import { Menu, PanelRightClose, PanelRightOpen } from 'lucide-react';

interface TopBarProps {
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  chatOpen?: boolean;
  onToggleChat?: () => void;
}

export default function TopBar({ sidebarOpen, onToggleSidebar, chatOpen, onToggleChat }: TopBarProps) {
  return (
    <header className="flex h-[var(--topbar-height)] items-center justify-between border-b border-border bg-background px-3">
      <div className="flex items-center gap-2">
        {onToggleSidebar && (
          <button onClick={onToggleSidebar} type="button" className="btn-ghost h-8 w-8 p-0" title="Toggle sidebar">
            <Menu className="h-4 w-4" />
          </button>
        )}
        <span className="text-sm font-semibold text-foreground">Sai.ai</span>
      </div>
      <div className="flex items-center gap-1">
        {onToggleChat && (
          <button onClick={onToggleChat} type="button" className="btn-ghost h-8 w-8 p-0" title="Toggle chat">
            {chatOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </button>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
