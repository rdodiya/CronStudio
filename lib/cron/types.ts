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

export type DomSpec =
  | { type: 'any' } // ?
  | { type: 'all' } // *
  | { type: 'values'; values: number[] } // lists, ranges, steps e.g. [1, 15]
  | { type: 'last' } // L
  | { type: 'lastOffset'; offset: number } // L-n
  | { type: 'lastWeekday' } // LW
  | { type: 'nearestWeekday'; day: number }; // nW

export type DowSpec =
  | { type: 'any' } // ?
  | { type: 'all' } // *
  | { type: 'values'; values: number[] } // 1=SUN..7=SAT
  | { type: 'lastDay' } // L
  | { type: 'lastDayOfWeek'; day: number } // nL
  | { type: 'nthDayOfWeek'; day: number; nth: number }; // n#m

export interface QuartzSchedule {
  kind: 'quartz';
  raw: string;
  seconds: number[];
  minutes: number[];
  hours: number[];
  dom: DomSpec;
  months: number[];
  dow: DowSpec;
  years: number[] | null; // null = *
}

export interface RateSchedule {
  kind: 'rate';
  raw: string;
  every: number;
  unit: 'minute' | 'hour' | 'day';
}

export type Schedule = UnixSchedule | QuartzSchedule | RateSchedule;

export type ParseResult =
  | { ok: true; schedule: Schedule; issues: Issue[] }
  | { ok: false; issues: Issue[] };
