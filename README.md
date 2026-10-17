# Cron Studio

> **The Developer-Grade Cron Schedule Toolkit** — Interactive editor, visual timeline, plain-English translator, Daylight Saving Time safety validator, and multi-platform exporter.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Tested_with-Vitest-6E9F18?logo=vitest)](https://vitest.dev/)
[![Coverage](https://img.shields.io/badge/Coverage-91%25-brightgreen)](https://vitest.dev/)
[![Privacy](https://img.shields.io/badge/Privacy-100%25_Client--Side-emerald)](#privacy-guarantee)

---

## Overview

**Cron Studio** is a modern, high-precision cron expression utility designed for software engineers, DevOps practitioners, and cloud architects. It solves the subtle edge cases, timezone ambiguities, Daylight Saving Time (DST) traps, and syntax mismatches that plague traditional crontab editors.

Built as a **100% static, client-only Next.js application**, Cron Studio runs entirely inside your web browser. No expressions, timestamps, or operational schedules are ever sent to an external server.

---

## Key Features

### 1. Multi-Dialect Engine & Conversion
- **Standard Unix (5-field)**: Minute, Hour, Day of Month, Month, Day of Week.
- **Quartz Java / Spring (6 or 7-field)**: Seconds, Minutes, Hours, Day of Month, Month, Day of Week, Year (`?`, `L`, `W`, `#`).
- **AWS EventBridge & CloudWatch**: `cron(min hrs dom mon dow year)` and `rate(value unit)`.
- **GitHub Actions**: 5-field UTC cron schedules with minimum interval warnings.
- **Kubernetes `batch/v1` CronJob**: 5-field schedules with explicit `timeZone` field support and concurrency policy selection.
- **Vercel Cron**: UTC-only serverless cron specifications.
- **Bidirectional Safe Conversion**: Convert between Unix and Quartz with automatic symbol validation.

### 2. Plain-English Translator & Per-Field Breakdown
- Generates precise, natural-language English explanations (e.g., *"At 09:00, Monday through Friday"*).
- Interactive per-field breakdown cards detailing the exact contribution of each field token.
- Dialect-specific annotations (e.g. Quartz 1-indexed days where 1 = Sunday vs Unix where 0 = Sunday).

### 3. Daylight Saving Time (DST) & Safety Engine
- **Fast Bisection DST Detection**: Evaluates timezone shift boundaries across years in < 2ms without heavy dependencies.
- **DST Gap Warning**: Detects non-existent clock hours (e.g., 02:30 AM in `America/New_York` during spring-forward).
- **DST Overlap Warning**: Flags ambiguous repeated hours during autumn fall-back.
- **POSIX OR-Semantics Trap**: Warns when both Day of Month and Day of Week are restricted in Unix cron.
- **Frequency Analysis**: Flags excessively frequent jobs (< 60s) or platform rate violations.

### 4. Visual Timeline & Calendar Matrix
- **Interactive SVG Timeline**: Visualizes 7, 14, or 30-day forecast windows with day boundaries, now marker, DST transition flags, and up to 2,000 focusable run dots.
- **Monthly Calendar Matrix**: Displays the current month grid highlighting active schedule days, today, weekends, and DST shifts.
- **Upcoming Execution Table**: Computes 25, 50, or 100 upcoming runtimes showing local time and UTC side-by-side with relative timestamps.
- **Frequency & Volume Estimation**: Calculates executions per day, week, month, and year with locale-aware number formatting.

### 5. Multi-Platform Exporters
Export your schedule directly into ready-to-use infrastructure code:
- **Kubernetes**: Fully commented `batch/v1` `CronJob` YAML with `timeZone`, `concurrencyPolicy: Forbid`, and `historyLimits`.
- **GitHub Actions**: `.github/workflows/` YAML with `workflow_dispatch` trigger.
- **AWS EventBridge**: CDK/CloudFormation/CLI syntax with rate alternatives and UTC checks.
- **Vercel**: `vercel.json` crons configuration.
- **Cloudflare Workers**: `wrangler.toml` and JSONC triggers.

### 6. Deep Linking & Shareable URLs
- Share configurations with teammates via compact URL parameters (`?expr=...&dialect=...&tz=...&format=...`).
- Fully synchronized via `window.history.replaceState` without polluting browser back/forward history.
- Automatic sanitization against hostile XSS inputs.

---

## Privacy Guarantee

Cron Studio is engineered from the ground up for strict operational security:

- **100% Client-Side Execution**: All parsing, evaluation, formatting, and scheduling calculations run locally via WebAssembly and JavaScript in your browser.
- **Zero Remote Logging**: No analytics trackers, no telemetry SDKs, no external API requests.
- **Zero Server Storage**: Your internal job names, schedule frequencies, and timezones never leave your device.
- **Offline Capable**: Includes a built-in Service Worker that caches static assets for offline use.

---

## Local Development & Setup

### Prerequisites
- Node.js 20 or later
- pnpm 9 or later (`npm i -g pnpm`)

### Installation
```bash
# Clone the repository
git clone https://github.com/rdodiya/CronStudio.git
cd CronStudio

# Install dependencies with frozen lockfile
pnpm install
```

### Available Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Starts local development server at `http://localhost:3000` |
| `pnpm build` | Compiles an optimized, zero-server static HTML export into `out/` |
| `pnpm test` | Runs the Vitest test suite (125+ tests) |
| `pnpm vitest run --coverage` | Executes tests with v8 code coverage reporting |
| `pnpm typecheck` | Validates TypeScript types across the codebase (`tsc --noEmit`) |
| `pnpm lint` | Runs Next.js ESLint checks |
| `pnpm e2e` | Runs Playwright end-to-end tests across desktop and mobile viewports |

---

## Deployment

Because Cron Studio uses Next.js static HTML export (`output: 'export'`), the generated `out/` directory can be hosted on any static hosting platform or CDN:

### Deploy to Vercel
Connect your GitHub repository to Vercel. Next.js will detect the App Router and deploy automatically with zero backend server overhead.

### Deploy to Static Hosts (GitHub Pages, Cloudflare Pages, S3, Netlify)
```bash
# Generate the production static export
pnpm build

# The output folder `out/` contains all static assets, HTML, sitemap.xml, and robots.txt
```

---

## Dialect Syntax Comparison

| Feature | Unix (`unix`) | Quartz (`quartz`) | AWS EventBridge (`eventbridge`) |
|---|---|---|---|
| **Field Count** | 5 | 6 or 7 | 6 |
| **Seconds Field** | No (min. 1 min) | Yes (Field 1: 0–59) | No |
| **Day of Week** | 0–6 (0 = Sun, 6 = Sat) | 1–7 (1 = Sun, 7 = Sat) | 1–7 or SUN–SAT |
| **Unspecified Field** | `*` | `?` (DOM or DOW) | `?` (DOM or DOW) |
| **Special Symbols** | `*`, `/`, `-`, `,` | `*`, `/`, `-`, `,`, `?`, `L`, `W`, `#` | `*`, `/`, `-`, `,`, `?`, `L`, `#` |
| **Year Field** | None | Optional (Field 7) | Required (Field 6) |
| **Timezone Support** | Host dependent | Configurable | UTC only (`rate` or `cron`) |

---

## Post-v1 Roadmap

- [ ] **Natural Language Schedule Creation**: Type plain text (e.g. *"every third Thursday at 4 PM"*) to generate expressions.
- [ ] **Schedule Comparison Diff**: Compare two cron expressions visually side-by-side to identify overlapping executions or execution gaps.
- [ ] **Crontab Import & Bulk Export**: Import multi-line system `crontab` files and export batch reports.
- [ ] **Team Shared Presets**: Local encrypted storage of organization-specific schedule presets.
- [ ] **Webhook & Monitoring Simulation**: Simulate failure scenarios and alert escalation windows.

---

## License

This project is open source and available under the [MIT License](LICENSE).