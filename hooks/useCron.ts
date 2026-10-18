'use client';

import { useContext, useEffect, useMemo, useState } from 'react';
import { CronContext, CronContextValue } from '@/context/CronContext';
import { useDebounce } from './useDebounce';
import { parse, ParseResult } from '@/lib/cron/index';
import { analyze, Analysis } from '@/lib/cron/safety';
import { parseShareParams, toShareQuery } from '@/lib/share';

export function useCron() {
  const context = useContext(CronContext);
  if (!context) {
    throw new Error('useCron must be used within a CronProvider');
  }

  const { state, dispatch } = context;

  // On mount: hydrate from share URL if present
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      const share = parseShareParams(window.location.search);
      if (share.loaded) {
        dispatch({
          type: 'HYDRATE',
          patch: {
            ...(share.expr ? { expr: share.expr } : {}),
            ...(share.dialect ? { dialect: share.dialect } : {}),
            ...(share.tz ? { tz: share.tz } : {}),
            ...(share.now ? { nowOverride: share.now } : {}),
            ...(share.format ? { format: share.format } : {}),
            fromShare: true,
          },
        });
      }
    }
  }, [dispatch]);

  // Immediate live parse from undebounced expression
  const liveParse: ParseResult = useMemo(() => {
    return parse(state.expr, state.dialect);
  }, [state.expr, state.dialect]);

  // Debounced expr for heavy calculations (analysis, runs, frequency)
  const debouncedExpr = useDebounce(state.expr, 150);

  // Sync state to URL via history.replaceState
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && hasMounted) {
      const query = toShareQuery({
        expr: debouncedExpr,
        dialect: state.dialect,
        tz: state.tz,
        format: state.format,
        now: state.nowOverride,
      });
      const pathname = window.location.pathname || '/';
      window.history.replaceState(null, '', `${pathname}${query}`);
    }
  }, [debouncedExpr, state.dialect, state.tz, state.format, state.nowOverride, hasMounted]);

  // Pending calculation indicator: true when debounced differs from live for > 200ms
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (debouncedExpr !== state.expr) {
      const timer = setTimeout(() => {
        setPending(true);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setPending(false);
    }
  }, [debouncedExpr, state.expr]);

  // Determine effective now and nowIssue
  const { effectiveNow, nowIssue } = useMemo(() => {
    if (state.nowOverride) {
      const parsed = new Date(state.nowOverride);
      if (isNaN(parsed.getTime())) {
        return {
          effectiveNow: new Date(),
          nowIssue: "Invalid datetime format for 'now'; using current system time.",
        };
      }
      return {
        effectiveNow: parsed,
        nowIssue: null,
      };
    }
    return {
      effectiveNow: new Date(),
      nowIssue: null,
    };
  }, [state.nowOverride]);

  // Full analysis calculation
  const analysis: Analysis = useMemo(() => {
    return analyze({
      expr: debouncedExpr,
      dialect: state.dialect,
      tz: state.tz,
      now: effectiveNow,
      runCount: state.runCount,
    });
  }, [
    debouncedExpr,
    state.dialect,
    state.tz,
    state.runCount,
    effectiveNow,
  ]);

  return {
    state,
    dispatch,
    liveParse,
    analysis,
    pending,
    nowIssue,
  };
}
