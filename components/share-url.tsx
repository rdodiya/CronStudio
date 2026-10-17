'use client';

import React, { useState } from 'react';
import { useCron } from '@/hooks/useCron';
import { toShareQuery } from '@/lib/share';
import { Button } from './ui/button';
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
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        data-testid="copy-share-link"
        onClick={handleShare}
        className="inline-flex items-center gap-1.5 text-xs h-8"
        title="Copy shareable link with current configuration"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-green-500" />
            <span>Link Copied!</span>
          </>
        ) : (
          <>
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </>
        )}
      </Button>
    </div>
  );
}
