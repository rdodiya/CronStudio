import { Schedule, Dialect } from './types';
import { Explanation } from './formatter';
import { convertQuartzToUnix, convertUnixToQuartz } from './compatibility';

export type ExportFormat =
  | 'expression'
  | 'kubernetes'
  | 'github'
  | 'vercel'
  | 'eventbridge'
  | 'cloudflare-toml'
  | 'cloudflare-jsonc'
  | 'explanation';

export function exportAs(
  format: ExportFormat,
  i: {
    expr: string;
    dialect: Dialect;
    tz: string;
    schedule: Schedule;
    explanation: Explanation;
  }
): { text: string; warnings: string[] } {
  const warnings: string[] = [];

  if (format === 'expression') {
    return { text: i.expr, warnings: [] };
  }

  if (format === 'explanation') {
    return { text: i.explanation.summary, warnings: [] };
  }

  const unixTargets: ExportFormat[] = [
    'kubernetes',
    'github',
    'vercel',
    'cloudflare-toml',
    'cloudflare-jsonc',
  ];

  let effectiveUnixExpr = i.expr;

  if (unixTargets.includes(format)) {
    if (i.dialect === 'quartz' || i.dialect === 'eventbridge') {
      const converted = convertQuartzToUnix(i.expr);
      if (!converted.ok) {
        return {
          text: '',
          warnings: [`Conversion requires manual review: ${converted.reason}`],
        };
      }
      effectiveUnixExpr = converted.expr;
    }
  }

  const isUtc = i.tz === 'UTC' || i.tz === 'Etc/UTC';

  switch (format) {
    case 'kubernetes': {
      const manifest = `# Kubernetes CronJob (batch/v1)
apiVersion: batch/v1
kind: CronJob
metadata:
  name: scheduled-job
spec:
  schedule: "${effectiveUnixExpr}"
  timeZone: "${i.tz}"
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: job
              image: busybox:latest
              command:
                - /bin/sh
                - -c
                - echo "Executing scheduled task"
          restartPolicy: OnFailure`;
      return { text: manifest, warnings };
    }

    case 'github': {
      if (!isUtc) {
        warnings.push(
          `GitHub Actions schedules run strictly in UTC; local timezone '${i.tz}' will not apply.`
        );
      }
      const workflow = `# GitHub Actions scheduled workflow
# Note: Scheduled workflows run in UTC.
name: Scheduled Job
on:
  schedule:
    - cron: '${effectiveUnixExpr}'
  workflow_dispatch:

jobs:
  cron:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run scheduled task
        run: echo "Executing scheduled task"`;
      return { text: workflow, warnings };
    }

    case 'vercel': {
      if (!isUtc) {
        warnings.push(
          `Vercel Cron runs strictly in UTC; local timezone '${i.tz}' will not apply.`
        );
      }
      const json = JSON.stringify(
        {
          crons: [
            {
              path: '/api/cron',
              schedule: effectiveUnixExpr,
            },
          ],
        },
        null,
        2
      );
      return { text: json, warnings };
    }

    case 'eventbridge': {
      if (!isUtc) {
        warnings.push(
          `AWS EventBridge schedules run strictly in UTC; local timezone '${i.tz}' will not apply.`
        );
      }

      // Convert Unix expression to 6-field EventBridge cron: cron(min hour dom mon dow year)
      const asQuartz = convertUnixToQuartz(effectiveUnixExpr);
      const tokens = asQuartz.split(/\s+/);
      const ebCron = `cron(${tokens.slice(1).join(' ')} *)`;

      // Check if a rate expression equivalent is possible
      let rateExpr: string | null = null;
      const minStepMatch = effectiveUnixExpr.match(/^\*\/(\d+)\s+\*\s+\*\s+\*\s+\*$/);
      const hourStepMatch = effectiveUnixExpr.match(/^0\s+\*\/(\d+)\s+\*\s+\*\s+\*$/);
      const dailyMatch = effectiveUnixExpr.match(/^0\s+0\s+\*\s+\*\s+\*$/);

      if (minStepMatch) {
        const step = parseInt(minStepMatch[1], 10);
        if (60 % step === 0) {
          rateExpr = `rate(${step} ${step === 1 ? 'minute' : 'minutes'})`;
        }
      } else if (hourStepMatch) {
        const step = parseInt(hourStepMatch[1], 10);
        if (24 % step === 0) {
          rateExpr = `rate(${step} ${step === 1 ? 'hour' : 'hours'})`;
        }
      } else if (dailyMatch) {
        rateExpr = 'rate(1 day)';
      }

      if (rateExpr) {
        warnings.push(
          'rate expressions are not clock-aligned (e.g. rate(1 hour) runs 1 hour after creation, not on the clock hour).'
        );
        return {
          text: `# AWS EventBridge Scheduled Rule
Cron format:
${ebCron}

Rate format:
${rateExpr}`,
          warnings,
        };
      }

      return {
        text: `# AWS EventBridge Scheduled Rule
${ebCron}`,
        warnings,
      };
    }

    case 'cloudflare-toml': {
      if (!isUtc) {
        warnings.push(
          `Cloudflare Cron Triggers run strictly in UTC; local timezone '${i.tz}' will not apply.`
        );
      }
      const toml = `# Cloudflare Workers configuration
name = "my-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[triggers]
crons = ["${effectiveUnixExpr}"]`;
      return { text: toml, warnings };
    }

    case 'cloudflare-jsonc': {
      if (!isUtc) {
        warnings.push(
          `Cloudflare Cron Triggers run strictly in UTC; local timezone '${i.tz}' will not apply.`
        );
      }
      const jsonc = `// Cloudflare Workers configuration (runs in UTC)
{
  "name": "my-worker",
  "main": "src/index.ts",
  "compatibility_date": "2024-01-01",
  "triggers": {
    "crons": [
      "${effectiveUnixExpr}"
    ]
  }
}`;
      return { text: jsonc, warnings };
    }
  }
}
