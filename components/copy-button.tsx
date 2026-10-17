'use client';

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from './ui/button';

export interface CopyButtonProps {
  text: string;
  label: string;
  big?: boolean;
  testId?: string;
}

export function CopyButton({ text, label, big, testId }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      setLiveAnnouncement(`Copied ${label} to clipboard`);

      setTimeout(() => {
        setCopied(false);
        setLiveAnnouncement('');
      }, 2000);
    } catch {
      setLiveAnnouncement(`Failed to copy ${label}`);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <Button
        variant={big ? 'default' : 'outline'}
        size={big ? 'default' : 'sm'}
        onClick={handleCopy}
        data-testid={testId}
        aria-label={`Copy ${label}`}
        className="inline-flex items-center gap-1.5"
      >
        {copied ? (
          <>
            <Check data-testid="copy-check" className="w-4 h-4 text-green-500" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            <span>{big ? `Copy ${label}` : 'Copy'}</span>
          </>
        )}
      </Button>

      {/* Screen reader announcement live region */}
      <div role="status" aria-live="polite" className="sr-only">
        {liveAnnouncement}
      </div>

      {/* Visual toast for big button */}
      {big && copied && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 text-xs bg-popover text-popover-foreground border rounded shadow animate-in fade-in">
          Copied to clipboard!
        </div>
      )}
    </div>
  );
}
