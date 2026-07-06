'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const preferred = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme:dark)').matches);
    setDark(preferred);
    document.documentElement.classList.toggle('dark', preferred);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <button onClick={toggle} type="button" className="rounded-md border border-input bg-background p-2 text-sm hover:bg-accent" title="Toggle theme">
      {dark ? '☀️' : '🌙'}
    </button>
  );
}
