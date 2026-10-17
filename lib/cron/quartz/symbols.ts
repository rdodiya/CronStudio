export const QUARTZ_SYMBOL_HELP: Record<'?' | 'L' | 'W' | '#', string> = {
  '?': "Specifies 'no specific value'. In Quartz cron, exactly one of Day-of-Month or Day-of-Week must be '?'.",
  L: "Stands for 'last'. In Day-of-Month, 'L' means the last day of the month (or 'L-n' for n days before the end). In Day-of-Week, 'nL' means the last occurrence of day n in the month (e.g. '6L' for last Friday).",
  W: "Stands for 'weekday' (Monday through Friday). 'nW' specifies the nearest weekday to day n of the month (e.g. '15W'). 'LW' specifies the last weekday of the month.",
  '#': "Specifies the nth weekday of the month. 'n#m' indicates the mth occurrence of weekday n (e.g. '6#3' specifies the third Friday of the month; 1=SUN..7=SAT).",
};

export const QUARTZ_DOW_NAMES: Record<number, string> = {
  1: 'Sunday',
  2: 'Monday',
  3: 'Tuesday',
  4: 'Wednesday',
  5: 'Thursday',
  6: 'Friday',
  7: 'Saturday',
};

export function getQuartzDowName(dow: number): string {
  return QUARTZ_DOW_NAMES[dow] ?? `Day ${dow}`;
}
