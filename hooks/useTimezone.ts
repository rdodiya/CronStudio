import { useState, useEffect } from 'react';
import { browserTz, listTzs, isValidTz } from '@/lib/timezone';

export function useTimezone() {
  const [currentTz, setCurrentTz] = useState<string>('UTC');
  const [availableTzs, setAvailableTzs] = useState<string[]>(['UTC']);

  useEffect(() => {
    setCurrentTz(browserTz());
    setAvailableTzs(listTzs());
  }, []);

  return {
    currentTz,
    availableTzs,
    isValidTz,
  };
}
