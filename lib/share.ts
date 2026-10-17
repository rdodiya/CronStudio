import { Dialect } from './cron/types';
import { DIALECTS } from './cron/dialects';
import { ExportFormat } from './cron/exporter';
import { isValidTz } from './timezone';

const VALID_FORMATS: ExportFormat[] = [
  'expression',
  'kubernetes',
  'github',
  'vercel',
  'eventbridge',
  'cloudflare-toml',
  'cloudflare-jsonc',
  'explanation',
];

export interface ShareState {
  expr?: string;
  dialect?: Dialect;
  tz?: string;
  format?: ExportFormat;
  loaded: boolean;
}

export function parseShareParams(search: string): ShareState {
  try {
    const query = search.startsWith('?') ? search.slice(1) : search;
    const params = new URLSearchParams(query);

    let expr: string | undefined = undefined;
    let loaded = false;

    const rawExpr = params.get('expr');
    if (rawExpr && rawExpr.trim().length > 0 && rawExpr.length <= 200) {
      expr = rawExpr;
      loaded = true;
    }

    let dialect: Dialect | undefined = undefined;
    const rawDialect = params.get('dialect');
    if (rawDialect && rawDialect in DIALECTS) {
      dialect = rawDialect as Dialect;
    }

    let tz: string | undefined = undefined;
    const rawTz = params.get('tz');
    if (rawTz && isValidTz(rawTz)) {
      tz = rawTz;
    }

    let format: ExportFormat | undefined = undefined;
    const rawFormat = params.get('format');
    if (rawFormat && (VALID_FORMATS as string[]).includes(rawFormat)) {
      format = rawFormat as ExportFormat;
    }

    return {
      expr,
      dialect,
      tz,
      format,
      loaded,
    };
  } catch {
    return { loaded: false };
  }
}

export function toShareQuery(s: {
  expr: string;
  dialect: Dialect;
  tz: string;
  format: ExportFormat;
}): string {
  const params = new URLSearchParams();
  if (s.expr) params.set('expr', s.expr);
  if (s.dialect) params.set('dialect', s.dialect);
  if (s.tz) params.set('tz', s.tz);
  if (s.format) params.set('format', s.format);

  return `?${params.toString()}`;
}
