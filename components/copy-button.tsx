'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  label?: string;
  testId?: string;
  className?: string;
  big?: boolean;
}

export function CopyButton({
  text,
  label = 'Copy',
  testId = 'copy-button',
  className,
  big,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [announced, setAnnounced] = useState('');

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      setAnnounced(`Copied ${label}`);
      setTimeout(() => {
        setCopied(false);
        setAnnounced('');
      }, 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <>
      <button
        type="button"
        data-testid={testId}
        onClick={handleCopy}
        aria-label={copied ? 'Copied to clipboard' : `Copy ${label}`}
        className={`inline-flex items-center gap-1.5 font-mono font-black uppercase border-2 border-border shadow-[2px_2px_0px_var(--border)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-none ${
          big ? 'px-3.5 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'
        } ${
          copied
            ? 'bg-primary text-primary-foreground'
            : 'bg-card text-foreground hover:bg-primary hover:text-primary-foreground'
        } ${className || ''}`}
      >
        {copied ? (
          <>
            <Check data-testid="copy-check" className="w-3.5 h-3.5" />
            <span>COPIED!</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            <span>{label}</span>
          </>
        )}
      </button>
      <div role="status" aria-live="polite" className="sr-only">
        {announced}
      </div>
    </>
  );
}
