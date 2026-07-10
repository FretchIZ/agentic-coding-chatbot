'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycle = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const icon = theme === 'dark' ? <Sun className="h-4 w-4" /> : theme === 'system' ? <Moon className="h-4 w-4" /> : <Monitor className="h-4 w-4" />;
  const label = theme === 'dark' ? 'Switch to light' : theme === 'system' ? 'Switch to dark' : 'Switch to system';

  return (
    <button
      onClick={cycle}
      type="button"
      className="btn-ghost h-9 w-9 p-0"
      title={label}
    >
      {icon}
    </button>
  );
}
