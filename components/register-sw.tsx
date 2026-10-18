'use client';

import { useEffect } from 'react';

export function RegisterSw() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator
    ) {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      navigator.serviceWorker
        .register(`${basePath}/sw.js`)
        .catch((err) => {
          console.warn('Service worker registration failed:', err);
        });
    }
  }, []);

  return null;
}
