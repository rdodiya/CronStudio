export type Dialect =
  | 'unix'
  | 'quartz'
  | 'kubernetes'
  | 'github'
  | 'eventbridge'
  | 'vercel'
  | 'cloudflare';

export type IssueField =
  | 'second'
  | 'minute'
  | 'hour'
  | 'dayOfMonth'
  | 'month'
  | 'dayOfWeek'
  | 'year'
  | 'expression';

export type IssueSeverity = 'error' | 'warning' | 'info';

export interface Issue {
  field: string;
  message: string;
  severity: IssueSeverity;
}

export interface UnixSchedule {
  kind: 'unix';
  raw: string;
  minutes: number[];
  hours: number[];
  doms: number[];
  months: number[];
  dows: number[]; // 0–6, 0=SUN; 7 normalised to 0
  domRestricted: boolean;
  dowRestricted: boolean;
}

export interface QuartzSchedulePlaceholder {
  kind: 'quartz';
  raw: string;
  [key: string]: unknown;
}

export interface RateSchedulePlaceholder {
  kind: 'rate';
  raw: string;
  [key: string]: unknown;
}

export type Schedule = UnixSchedule | QuartzSchedulePlaceholder | RateSchedulePlaceholder;

export type ParseResult =
  | { ok: true; schedule: Schedule; issues: Issue[] }
  | { ok: false; issues: Issue[] };
