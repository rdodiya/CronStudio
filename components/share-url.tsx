'use client';

import React, { useState } from 'react';
import { useCron } from '@/hooks/useCron';
import { toShareQuery } from '@/lib/share';
import { Share2, Check } from 'lucide-react';

export function ShareUrl() {
  const { state } = useCron();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      const query = toShareQuery({
        expr: state.expr,
        dialect: state.dialect,
        tz: state.tz,
        format: state.format,
      });

      const baseUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}${window.location.pathname}`
          : 'https://cronstudio.dev';

      const fullUrl = `${baseUrl}${query}`;

      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(fullUrl);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <button
      type="button"
      data-testid="copy-share-link"
      onClick={handleShare}
      title="Copy shareable link with current configuration"
      className="flex items-center gap-1.5 px-3 py-1 bg-card hover:bg-muted border-2 border-border font-mono text-xs font-black uppercase text-foreground shadow-[2px_2px_0px_var(--border)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-none"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-signal-green" />
          <span>LINK_COPIED!</span>
        </>
      ) : (
        <>
          <Share2 className="w-3.5 h-3.5" />
          <span>SHARE_URL</span>
        </>
      )}
    </button>
  );
}
