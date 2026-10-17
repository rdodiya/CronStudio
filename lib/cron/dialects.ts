import { Dialect } from './types';

export interface DialectMeta {
  label: string;
  family: 'unix' | 'quartz' | 'eventbridge';
  utcOnly: boolean;
  minIntervalMin?: number;
  docUrl: string;
}

export const DIALECTS: Record<Dialect, DialectMeta> = {
  unix: {
    label: 'Unix Cron',
    family: 'unix',
    utcOnly: false,
    docUrl: 'https://man7.org/linux/man-pages/man5/crontab.5.html',
  },
  quartz: {
    label: 'Quartz Cron',
    family: 'quartz',
    utcOnly: false,
    docUrl: 'http://www.quartz-scheduler.org/documentation/quartz-2.3.0/tutorials/crontrigger.html',
  },
  kubernetes: {
    label: 'Kubernetes CronJob',
    family: 'unix',
    utcOnly: false,
    docUrl: 'https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/',
  },
  github: {
    label: 'GitHub Actions',
    family: 'unix',
    utcOnly: true,
    minIntervalMin: 5,
    docUrl: 'https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule',
  },
  eventbridge: {
    label: 'AWS EventBridge',
    family: 'eventbridge',
    utcOnly: true,
    docUrl: 'https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-create-rule-schedule.html',
  },
  vercel: {
    label: 'Vercel Cron',
    family: 'unix',
    utcOnly: true,
    docUrl: 'https://vercel.com/docs/cron-jobs',
  },
  cloudflare: {
    label: 'Cloudflare Cron Triggers',
    family: 'unix',
    utcOnly: true,
    docUrl: 'https://developers.cloudflare.com/workers/configuration/cron-triggers/',
  },
};
