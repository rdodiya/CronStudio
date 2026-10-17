export interface FaqItem {
  q: string;
  a: string;
}

export const FAQS: Record<string, FaqItem[]> = {
  '/cron-expression-explainer': [
    {
      q: 'How does standard Unix cron syntax work?',
      a: 'Standard Unix cron expressions consist of 5 space-delimited fields: Minute (0-59), Hour (0-23), Day of Month (1-31), Month (1-12 or JAN-DEC), and Day of Week (0-6 or SUN-SAT, where 0 and 7 both represent Sunday in many modern engines). Each field can contain numbers, ranges (e.g. 1-5), lists (e.g. 1,15), steps (e.g. */15), or asterisks for any value.',
    },
    {
      q: 'What is the Unix Day of Month and Day of Week OR-relationship trap?',
      a: 'In POSIX and standard Unix cron implementations, when both the Day of Month (field 3) and Day of Week (field 5) are restricted (neither is an asterisk), the schedule matches if EITHER field matches. For example, "0 0 13 * 5" fires on every Friday AND on the 13th of every month, which surprises many engineers expecting an AND condition.',
    },
    {
      q: 'How does daylight saving time (DST) affect cron jobs?',
      a: 'During spring forward transitions (1-hour gap), schedules set between 02:00 and 02:59 in regions like North America will not execute because that clock hour is skipped. During autumn fall back transitions (1-hour overlap), schedules in the repeated hour may run twice unless deduplicated by your scheduler.',
    },
  ],
  '/quartz-cron-generator': [
    {
      q: 'How does Quartz cron differ from standard Unix cron?',
      a: 'Quartz cron uses 6 or 7 fields instead of 5, beginning with Seconds (0-59) and optionally ending with Year. Additionally, Day of Week is 1-indexed (1 = Sunday, 7 = Saturday), and Quartz requires the question mark (?) in either Day of Month or Day of Week whenever the other is specified.',
    },
    {
      q: 'What do L, W, and # mean in Quartz cron?',
      a: 'L stands for "last" (e.g. L in DOM means last day of the month; 5L in DOW means last Thursday of the month). W specifies the nearest weekday (Monday–Friday) to a given day of the month. The hash (#) specifies the N-th occurrence of a weekday in the month (e.g. 6#3 means the third Friday of the month).',
    },
    {
      q: 'Can Quartz cron expressions run every second?',
      a: 'Yes, Quartz natively supports sub-minute granularity via the seconds field (e.g. "*/10 * * * * ?" executes every 10 seconds), whereas standard Unix cron has a minimum resolution of 1 minute.',
    },
  ],
  '/kubernetes-cronjob-schedule-generator': [
    {
      q: 'How do Kubernetes CronJobs handle timezones?',
      a: 'Starting in Kubernetes v1.27 (GA), CronJobs support an explicit "timeZone" property in the Job specification (e.g. "timeZone: America/New_York"). Prior to v1.25, or if omitted, all schedules are evaluated relative to the local time of the kube-controller-manager host, typically UTC.',
    },
    {
      q: 'What concurrency policy should I choose for Kubernetes CronJobs?',
      a: 'Kubernetes offers three concurrency policies: "Allow" (jobs can run concurrently), "Forbid" (skips new job runs if the previous run has not yet finished), and "Replace" (cancels the currently running job and starts a new one). "Forbid" is recommended for database migrations and idempotent synchronization tasks.',
    },
    {
      q: 'Why does Kubernetes miss a scheduled CronJob run?',
      a: 'If a CronJob fails to schedule for more than 100 missed schedule times (for instance if kube-controller-manager is offline or paused), Kubernetes logs an error and stops attempting to schedule further runs until manually investigated.',
    },
  ],
  '/cron-next-run-calculator': [
    {
      q: 'How are upcoming execution dates calculated in Cron Studio?',
      a: 'Cron Studio computes next runs entirely in your browser using high-performance state-machine evaluation taking your specified IANA timezone into account. We cross-reference historical and future daylight saving time boundaries to alert you to skipped or repeated hours.',
    },
    {
      q: 'Why do local time and UTC time differ?',
      a: 'Local time reflects the clock on the wall in a specific geographic timezone (e.g. EDT or IST), whereas UTC is universal coordinated time with no daylight saving shifts. Cloud infrastructure (AWS, GitHub Actions) typically runs on UTC, while business users schedule jobs according to local office hours.',
    },
    {
      q: 'Does Cron Studio send schedule expressions to a server?',
      a: 'No. Cron Studio is a 100% static client-side application. Your expressions, timezones, and schedule metadata never leave your browser, ensuring complete privacy for proprietary operational schedules.',
    },
  ],
  '/aws-eventbridge-cron-expression': [
    {
      q: 'What is the syntax for AWS EventBridge cron rules?',
      a: 'AWS EventBridge cron expressions always use 6 required fields: Minutes, Hours, Day-of-month, Month, Day-of-week, and Year (cron(fields)). All EventBridge cron expressions are evaluated strictly in UTC. Like Quartz, EventBridge requires a question mark (?) in either Day-of-month or Day-of-week.',
    },
    {
      q: 'What is the difference between EventBridge rate() and cron()?',
      a: 'rate() expressions (e.g. "rate(5 minutes)") trigger periodically starting from the moment the rule is created or updated; they are not aligned to clock boundaries. cron() expressions (e.g. "cron(0/5 * * * ? *)") align strictly to clock minutes (such as :00, :05, :10).',
    },
    {
      q: 'Can AWS EventBridge evaluate schedules in local timezones?',
      a: 'AWS EventBridge cron expressions only run in UTC. To trigger events according to local business hours in cities that observe Daylight Saving Time, you must use EventBridge Scheduler (which supports timezone configuration) or compensate for DST offsets.',
    },
  ],
};
