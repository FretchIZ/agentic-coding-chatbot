'use client';

import { GitBranch, CircleCheck, CircleAlert, Wifi, WifiOff } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

interface StatusBarProps {
  branch?: string;
  cursorPosition?: { line: number; col: number };
  language?: string;
  connected?: boolean;
  fileCount?: number;
}

export default function StatusBar({
  branch = 'main',
  cursorPosition,
  language,
  connected = true,
  fileCount,
}: StatusBarProps) {
  const { resolvedTheme } = useTheme();

  return (
    <footer className="flex h-[var(--statusbar-height)] items-center justify-between border-t border-border bg-sidebar-background px-3 text-xs text-sidebar-foreground">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <GitBranch className="h-3 w-3" />
          <span>{branch}</span>
        </div>
        {fileCount !== undefined && (
          <span className="text-muted-foreground">{fileCount} files</span>
        )}
        {connected ? (
          <div className="flex items-center gap-1 text-success">
            <Wifi className="h-3 w-3" />
            <span>Connected</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-destructive">
            <WifiOff className="h-3 w-3" />
            <span>Disconnected</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {language && <span className="text-muted-foreground">{language}</span>}
        {cursorPosition && (
          <span className="text-muted-foreground">
            Ln {cursorPosition.line}, Col {cursorPosition.col}
          </span>
        )}
        <div className="flex items-center gap-1">
          {resolvedTheme === 'dark' ? (
            <CircleCheck className="h-3 w-3 text-success" />
          ) : (
            <CircleAlert className="h-3 w-3 text-warning" />
          )}
          <span>{resolvedTheme === 'dark' ? 'Dark' : 'Light'}</span>
        </div>
      </div>
    </footer>
  );
}
