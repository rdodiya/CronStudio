# Cron Studio — Project Requirements Document

## Project Overview

**Name:** Cron Studio  
**Type:** Single-page Next.js + TypeScript web application  
**Goal:** Help developers understand, validate, visualize, and safely deploy cron schedules.  
**Philosophy:** Privacy-first, browser-only, no backend, no data upload, no login, no ads in v1.

---

## Core Requirements

### 1. Technology Stack

- **Framework:** Next.js 14+ App Router
- **Language:** TypeScript strict mode
- **Styling:** Tailwind CSS + shadcn/ui
- **State management:** `useReducer` + Context; derived values via `useMemo`
- **Visualization:** Custom SVG timeline + HTML/CSS calendar; no chart library
- **Timezone handling:** `Intl.DateTimeFormat` + `date-fns-tz`
- **Cron parsing:**
  - `croner` for Unix cron evaluation and next-run calculation
  - Custom Quartz parser/normalizer for Quartz-specific syntax
- **Testing:** Vitest + React Testing Library
- **Package manager:** pnpm

> **Important:** Do not rely on `croner` alone for full Quartz support. Use it for Unix scheduling and next-run evaluation; implement a separate Quartz syntax layer for `?`, `L`, `W`, `#`, seconds, year field, and Quartz weekday numbering.

---

### 2. Supported Schedule Formats

| Format | Fields | Support level |
|---|---:|---|
| Standard Unix cron | 5 | Full support |
| Quartz cron | 6/7 | Full parse/explain support; conversion to Unix only when safely possible |
| Kubernetes CronJob | 5 | Full support |
| GitHub Actions | 5 | Full support |
| AWS EventBridge | `rate()` / cron | Full support |
| Vercel Cron | 5 | Full support |
| Cloudflare Cron Triggers | 5 | Full support |

### Platform rules

- Unix, Kubernetes, GitHub Actions, Vercel, and Cloudflare use 5-field cron.
- Quartz uses 6 or 7 fields and has different weekday numbering and special symbols.
- AWS EventBridge uses its own cron syntax and also supports `rate()` expressions.
- The app must clearly identify the selected dialect and prevent unsafe automatic conversion.

---

### 3. Input Features

- [ ] Cron expression input with instant validation and debounced updates, approximately 150 ms
- [ ] Dialect selector: Unix, Quartz, Kubernetes, GitHub Actions, AWS EventBridge, Vercel, Cloudflare
- [ ] IANA timezone selector, defaulting to browser timezone
- [ ] Optional current-time override for testing schedules
- [ ] Visual builder using presets plus a frequency-first form
- [ ] Two-way synchronization between visual builder and raw expression
- [ ] Advanced field editor always visible for developers
- [ ] Read-only preview calendar and timeline
- [ ] Example-expression chips and documentation links

### Visual builder behavior

1. User selects a preset or starts custom.
2. User chooses frequency: minutes, hourly, daily, weekly, monthly, or custom.
3. UI shows only relevant controls.
4. Generated expression, plain-English summary, and next-run preview update instantly.
5. User can switch to raw expression mode at any time.

### Presets

- Every 5 minutes
- Every 15 minutes from 9 AM to 6 PM
- Hourly
- Daily at 9:00 AM
- Weekdays at 9:00 AM
- Every Monday at 10:00 AM
- First day of every month at midnight
- Custom schedule

---

### 4. Explanation Output

- [ ] One-sentence plain-English summary
- [ ] Field-by-field breakdown
- [ ] Human-readable schedule description
- [ ] Warning when both day-of-month and day-of-week are restricted in standard cron, because standard cron uses OR semantics between them
- [ ] Explanation of Quartz-only symbols:
  - `?`
  - `L`
  - `W`
  - `#`
- [ ] Explanation of differences between Unix and Quartz weekday numbering
- [ ] Explanation of seconds and optional year field in Quartz

---

### 5. Visualization

- [ ] Next 25 run times in selected timezone and UTC
- [ ] Horizontal timeline for the next 7 days
- [ ] Monthly calendar with highlighted scheduled days
- [ ] Frequency summary: runs per day, week, month, and year
- [ ] DST visualization:
  - Spring-forward skipped times
  - Fall-back duplicated or ambiguous times
- [ ] Clear distinction between local scheduled time and UTC execution time

---

### 6. Safety and Quality Checks

- [ ] Invalid expression detection with actionable, field-specific errors
- [ ] Detection of schedules that can never match
- [ ] Detection of excessively frequent schedules
- [ ] Detection of business-hours schedules
- [ ] Detection of weekday-only or weekend-only patterns
- [ ] Detection of DST gaps, overlaps, and timezone ambiguity
- [ ] Platform compatibility badges
- [ ] Warnings when converting between incompatible dialects

### Compatibility badge examples

- `Unix compatible`
- `Quartz compatible`
- `Kubernetes compatible`
- `GitHub Actions compatible`
- `AWS EventBridge compatible`
- `Vercel compatible`
- `Cloudflare compatible`
- `Conversion requires manual review`

---

### 7. Export Formats

- [ ] Copyable cron expression
- [ ] Kubernetes CronJob YAML
- [ ] GitHub Actions workflow YAML
- [ ] Vercel cron configuration for `vercel.json`
- [ ] AWS EventBridge schedule expression
- [ ] Cloudflare Wrangler cron trigger configuration
- [ ] Shareable URL containing expression, dialect, timezone, and selected format
- [ ] Copyable plain-English explanation

### Shareable URL rule

Use URL query parameters for user-generated expressions:

```text
/?expr=0+9+*+*+1-5&tz=Asia/Kolkata&dialect=unix
```

Do not create an unbounded dynamic route for every possible expression.

---

### 8. SEO Pages

Use statically generated routes for known topics and expressions.

- [ ] `/cron-expression-explainer`
- [ ] `/quartz-cron-generator`
- [ ] `/kubernetes-cronjob-schedule-generator`
- [ ] `/cron-next-run-calculator`
- [ ] `/aws-eventbridge-cron-expression`
- [ ] `/cron-expression/[slug]` for a predefined allowlist of common expressions
- [ ] `sitemap.xml`
- [ ] `robots.txt`
- [ ] FAQ schema
- [ ] Open Graph and Twitter card metadata
- [ ] Static explanatory content for each landing page

### Dynamic SEO route rule

For `/cron-expression/[slug]`, use `generateStaticParams()` with a curated list of common expressions.

Examples:

- `0-9-1-1-5`
- `0-0-1---`
- `*/15-9-18---1-5`
- `0-9---1`
- `0-0-1-1-`

Do not generate pages for arbitrary user input.

---

### 9. UI/UX Requirements

- [ ] Clean, minimal developer-tool aesthetic
- [ ] Dark and light mode with system preference detection and manual override
- [ ] Instant updates while typing
- [ ] Keyboard accessible
- [ ] Mobile responsive
- [ ] No login required
- [ ] No ads in v1
- [ ] Clear empty state
- [ ] Clear error state
- [ ] Copy feedback for every copyable output

---

## Architecture

```text
cron-studio/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── cron-expression-explainer/
│   │   └── page.tsx
│   ├── quartz-cron-generator/
│   │   └── page.tsx
│   ├── kubernetes-cronjob-schedule-generator/
│   │   └── page.tsx
│   ├── cron-next-run-calculator/
│   │   └── page.tsx
│   ├── aws-eventbridge-cron-expression/
│   │   └── page.tsx
│   ├── cron-expression/
│   │   └── [slug]/
│   │       └── page.tsx
│   ├── sitemap.ts
│   └── robots.ts
├── components/
│   ├── ui/
│   ├── cron-input.tsx
│   ├── dialect-selector.tsx
│   ├── timezone-selector.tsx
│   ├── visual-builder.tsx
│   ├── explanation-panel.tsx
│   ├── next-runs-table.tsx
│   ├── timeline.tsx
│   ├── calendar.tsx
│   ├── frequency-summary.tsx
│   ├── safety-checks.tsx
│   ├── export-panel.tsx
│   └── share-url.tsx
├── lib/
│   ├── cron/
│   │   ├── unix/
│   │   │   ├── parser.ts
│   │   │   ├── validator.ts
│   │   │   └── scheduler.ts
│   │   ├── quartz/
│   │   │   ├── parser.ts
│   │   │   ├── validator.ts
│   │   │   └── symbols.ts
│   │   ├── eventbridge/
│   │   │   ├── parser.ts
│   │   │   └── rate.ts
│   │   ├── formatter.ts
│   │   ├── exporter.ts
│   │   ├── compatibility.ts
│   │   └── types.ts
│   ├── timezone.ts
│   ├── dst.ts
│   ├── seo/
│   │   ├── expressions.ts
│   │   └── faqs.ts
│   └── utils.ts
├── hooks/
│   ├── useCron.ts
│   ├── useTimezone.ts
│   └── useDebounce.ts
├── context/
│   └── CronContext.tsx
├── tests/
│   ├── cron/
│   ├── dst/
│   ├── exporter/
│   └── components/
├── public/
├── .github/
│   └── workflows/
│       └── ci.yml
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── README.md
└── LICENSE
```

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|---|---|---|
| App structure | Single Next.js app with `lib/cron` core | Fast to build and deploy; extract packages later if needed |
| Unix cron engine | `croner` | Lightweight, TypeScript-friendly, timezone and DST-aware |
| Quartz engine | Custom parser + normalizer | `croner` does not fully replace a Quartz-specific parser |
| State | `useReducer` + Context | Zero extra dependencies; appropriate for this scope |
| Visualization | Custom SVG + CSS | Lightweight and fully controllable |
| Timezones | `Intl.DateTimeFormat` + `date-fns-tz` | Native timezone support plus reliable conversions |
| Testing | Vitest + React Testing Library | Fast, modern developer experience |
| Deployment | Static export or Vercel | No backend required |

---

## Static Export Constraints

- Use `output: 'export'` only if static hosting is required.
- All dynamic SEO routes must use `generateStaticParams()`.
- Do not use API routes, server actions, or runtime server logic.
- User-specific expressions must be handled through query parameters, not dynamic route segments.
- Metadata must be defined in Server Components using `metadata` or `generateMetadata`.

---

## Testing Requirements

### Cron engine tests

- Valid and invalid expressions for every supported dialect
- Unix DOM/DOW OR-semantics cases
- Quartz `?`, `L`, `W`, `#`, seconds, and year-field cases
- AWS EventBridge `rate()` and cron expressions
- Next-run calculations across timezone boundaries
- DST spring-forward and fall-back cases
- Never-matching schedules
- Platform export snapshot tests

### Minimum DST test cases

- `America/New_York` spring-forward
- `America/New_York` fall-back
- `Europe/London` spring-forward
- `Europe/London` fall-back
- `Asia/Kolkata`, which has no DST
- UTC schedules evaluated in a DST timezone

---

## Non-Goals for v1

- User accounts
- Saved schedules
- Team workspaces
- Background job monitoring
- Alerts when a cron job fails
- AI-generated cron expressions
- Paid plans
- Ads
- Backend API
- Mobile app

---

## Success Criteria

1. All supported dialects parse, validate, explain, and export correctly.
2. Next 25 run times are accurate across DST boundaries.
3. Visual builder generates valid cron for every preset.
4. Export output is valid for each target platform.
5. SEO pages render with correct metadata, structured data, and static content.
6. Lighthouse score is above 90 for performance, accessibility, best practices, and SEO.
7. Initial JavaScript bundle is below 200 KB gzipped.
8. Cron engine test coverage is above 90 percent.
9. The app works fully offline after initial load.
10. No user cron expression or input data is transmitted to a server.