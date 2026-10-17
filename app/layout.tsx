import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

import { RegisterSw } from '@/components/register-sw';

export const metadata: Metadata = {
  metadataBase: new URL('https://cronstudio.dev'),
  title: {
    default: 'Cron Studio — The Developer-Grade Cron Toolkit',
    template: '%s | Cron Studio',
  },
  description:
    'Interactive cron schedule editor, visual builder, plain-English translator, multi-dialect support (Unix, Quartz, AWS, Kubernetes), DST-aware validator, and infrastructure exporters.',
  keywords: [
    'cron',
    'cron expression',
    'cron job',
    'crontab',
    'quartz cron',
    'kubernetes cronjob',
    'aws eventbridge cron',
    'cron schedule generator',
    'cron translator',
  ],
  authors: [{ name: 'Cron Studio' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://cronstudio.dev',
    siteName: 'Cron Studio',
    title: 'Cron Studio — The Developer-Grade Cron Toolkit',
    description:
      'Developer-grade cron schedule editor, explainer, visual timeline, daylight saving safety validator, and multi-platform exporter.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cron Studio — The Developer-Grade Cron Toolkit',
    description:
      'Developer-grade cron schedule editor, explainer, visual timeline, daylight saving safety validator, and multi-platform exporter.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('cs.theme');
                if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <RegisterSw />
        {children}
      </body>
    </html>
  );
}
