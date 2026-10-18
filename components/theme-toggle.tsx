'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { Button } from './ui/button';

type Theme = 'light' | 'dark' | 'system';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('cs.theme') as Theme | null;
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      setTheme(saved);
      applyTheme(saved);
    } else {
      applyTheme('system');
    }
  }, []);

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === 'dark') {
      root.classList.add('dark');
    } else if (t === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  const cycleTheme = () => {
    let next: Theme = 'light';
    if (theme === 'light') next = 'dark';
    else if (theme === 'dark') next = 'system';
    else if (theme === 'system') next = 'light';

    setTheme(next);
    localStorage.setItem('cs.theme', next);
    applyTheme(next);
  };

  return (
    <Button
      variant="outline"
      size="icon"
      data-testid="theme-toggle"
      onClick={cycleTheme}
      aria-label={`Current theme: ${theme}. Click to switch theme.`}
      title={`Theme: ${theme}`}
      className="h-8 w-8 bg-card border-2 border-border shadow-[2px_2px_0px_var(--border)]"
    >
      {mounted ? (
        <>
          {theme === 'light' && <Sun className="w-4 h-4 text-secondary" />}
          {theme === 'dark' && <Moon className="w-4 h-4 text-tertiary" />}
          {theme === 'system' && <Laptop className="w-4 h-4 text-muted-foreground" />}
        </>
      ) : (
        <Laptop className="w-4 h-4 text-muted-foreground" />
      )}
    </Button>
  );
}
