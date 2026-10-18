'use client';

import React, { createContext, useReducer, ReactNode, Dispatch } from 'react';
import { Dialect } from '@/lib/cron/types';
import { DIALECTS } from '@/lib/cron/dialects';
import { ExportFormat } from '@/lib/cron/exporter';
import { convertQuartzToUnix, convertUnixToQuartz } from '@/lib/cron/compatibility';
import { isValidTz } from '@/lib/timezone';
import { parseShareParams } from '@/lib/share';

export interface AppState {
  expr: string;
  dialect: Dialect;
  tz: string;
  nowOverride: string | null;
  format: ExportFormat;
  mode: 'builder' | 'raw';
  runCount: 25 | 50 | 100;
  fromShare: boolean;
}

export type Action =
  | { type: 'SET_EXPR'; expr: string }
  | { type: 'SET_DIALECT'; dialect: Dialect }
  | { type: 'SET_TZ'; tz: string }
  | { type: 'SET_NOW'; value: string | null }
  | { type: 'SET_FORMAT'; format: ExportFormat }
  | { type: 'SET_MODE'; mode: 'builder' | 'raw' }
  | { type: 'SET_RUN_COUNT'; n: 25 | 50 | 100 }
  | { type: 'HYDRATE'; patch: Partial<AppState> };

export const defaultState: AppState = {
  expr: '0 9 * * 1-5',
  dialect: 'unix',
  tz: 'UTC',
  nowOverride: null,
  format: 'expression',
  mode: 'raw',
  runCount: 25,
  fromShare: false,
};

export function getInitialState(initial?: Partial<AppState>): AppState {
  let fromUrl: Partial<AppState> = {};
  if (typeof window !== 'undefined' && window.location.search) {
    const share = parseShareParams(window.location.search);
    if (share.loaded) {
      fromUrl = {
        ...(share.expr ? { expr: share.expr } : {}),
        ...(share.dialect ? { dialect: share.dialect } : {}),
        ...(share.tz ? { tz: share.tz } : {}),
        ...(share.now ? { nowOverride: share.now } : {}),
        ...(share.format ? { format: share.format } : {}),
        fromShare: true,
      };
    }
  }

  return {
    ...defaultState,
    ...initial,
    ...fromUrl,
  };
}

export function cronReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_EXPR':
      return { ...state, expr: action.expr };

    case 'SET_DIALECT': {
      const oldFamily = DIALECTS[state.dialect]?.family ?? 'unix';
      const newFamily = DIALECTS[action.dialect]?.family ?? 'unix';

      let newExpr = state.expr;

      if (oldFamily === 'quartz' && newFamily === 'unix') {
        const conv = convertQuartzToUnix(state.expr);
        if (conv.ok) {
          newExpr = conv.expr;
        }
      } else if (oldFamily === 'unix' && newFamily === 'quartz') {
        newExpr = convertUnixToQuartz(state.expr);
      }

      return {
        ...state,
        dialect: action.dialect,
        expr: newExpr,
      };
    }

    case 'SET_TZ': {
      if (!isValidTz(action.tz)) {
        return state; // Drop invalid timezones, keep current state.tz
      }
      return { ...state, tz: action.tz };
    }

    case 'SET_NOW':
      return { ...state, nowOverride: action.value };

    case 'SET_FORMAT':
      return { ...state, format: action.format };

    case 'SET_MODE':
      return { ...state, mode: action.mode };

    case 'SET_RUN_COUNT':
      return { ...state, runCount: action.n };

    case 'HYDRATE':
      return { ...state, ...action.patch };

    default:
      return state;
  }
}

export interface CronContextValue {
  state: AppState;
  dispatch: Dispatch<Action>;
}

export const CronContext = createContext<CronContextValue | null>(null);

export function CronProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: Partial<AppState>;
}) {
  const [state, dispatch] = useReducer(
    cronReducer,
    initial,
    (init) => getInitialState(init)
  );

  return (
    <CronContext.Provider value={{ state, dispatch }}>
      {children}
    </CronContext.Provider>
  );
}
