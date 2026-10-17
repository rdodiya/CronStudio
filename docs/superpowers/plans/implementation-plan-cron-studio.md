# Cron Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A privacy-first, browser-only Next.js app that parses, explains, visualizes, safety-checks and exports cron schedules for 7 dialects.

**Architecture:** One Next.js app. All cron logic is pure TypeScript in `lib/cron` (no React). `croner` evaluates Unix-family schedules; a custom Quartz engine (day-walk + `date-fns-tz`) evaluates Quartz and EventBridge-cron. UI state is a reducer; everything derived (parse, runs, explanation, safety, exports) is computed with `useMemo` from debounced state. Static export, no server code.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind 3 + shadcn/ui, `croner`, `date-fns` + `date-fns-tz@3`, Vitest + React Testing Library, Playwright, pnpm.

**Spec:** `docs/superpowers/specs/PROJECT_REQUIREMENTS.md` (scope) and `docs/superpowers/specs/DESIGN_QUE_ANS.md` (approved decisions; wins over `DESIGN_QUESTIONS.md`, which is the superseded draft). Executors read both.

## Global Constraints

- Next.js 14+ App Router, TypeScript `strict`, pnpm, Tailwind + shadcn/ui, `useReducer` + Context + `useMemo`.
- No chart library: custom SVG timeline + HTML/CSS calendar.
- `croner` for Unix next-run; custom Quartz parser (`?`, `L`, `W`, `#`, seconds, year, 1=SUN weekday numbering). Never rely on `croner` for Quartz.
- No API routes, server actions, runtime server logic, analytics, login or ads. No user input leaves the browser. `output: 'export'`.
- Dynamic SEO route only via `generateStaticParams()` over a curated allowlist of **30** expressions. User expressions only via query params: `?expr=&tz=&dialect=&format=`.
- Debounce 150 ms for expensive computation; syntax errors immediate; "Calculating…" only if pending > 200 ms; never block typing.
- Next runs: 25 default, expand to 50/100. Timeline: 7 days default, toggles 14/30. Calendar first weekday from `Intl.Locale`, user override persisted in `localStorage`.
- Copy feedback: inline checkmark 1.5–2 s; toast additionally for YAML/JSON/TOML exports; `aria-live="polite"`.
- DST test zones: `UTC`, `Asia/Kolkata`, `America/New_York`, `Europe/London`, `Australia/Sydney`, `Pacific/Auckland`, `Asia/Tokyo`.
- Coverage: ≥90% on `lib/cron`, ≥70% overall. Initial JS < 200 KB gzipped. Lighthouse ≥ 90 in all four categories. Works offline after first load.
- Dark/light/system theme, saved to `localStorage`, applied before hydration (no flash).
- UTC-only targets (GitHub, Vercel, Cloudflare, EventBridge) are **never auto time-shifted**; non-UTC schedules get a warning instead.

## Review Focus

1. Garbage input (empty, whitespace, 10,000 chars, emoji, `<script>`): `parse` returns `ok:false` with an `expression` error and never throws. Owner: Task 1.
2. Impossible or very rare schedules (`0 0 31 2 *`, Quartz `0 0 0 31 4 ?`, `0 0 29 2 *`): `nextRuns` returns promptly with fewer than requested (never loops forever); never-match is reported. Owners: Tasks 2, 3, 8.
3. Hostile share URL (`?expr=<script>…&tz=Not/AZone&dialect=evil&format=x`): sanitized to defaults, no throw, no banner. Owner: Task 9.
4. Invalid timezone or invalid "current time" override: falls back to UTC / real now with an inline message. Owners: Tasks 6, 9.
5. Unix `0 0 13 * 5` runs on every Friday **and** every 13th (OR semantics), with a visible warning. Owner: Task 8.

---

## File Structure

Follows the tree in `PROJECT_REQUIREMENTS.md` plus: `lib/cron/index.ts` (public API), `lib/cron/dialects.ts`, `lib/cron/builder.ts`, `lib/share.ts`, `components/register-sw.tsx`, `public/sw.js`, `e2e/`, `vitest.config.ts`, `playwright.config.ts`. `parser.ts` = per-field validation/expansion; `validator.ts` = cross-field semantics (never-match, DOM/DOW). Tests mirror `lib/` under `tests/`.

---

### Task 1: Scaffold + Unix parser

**Files:**
- Create: project via `create-next-app`, `vitest.config.ts`, `lib/cron/types.ts`, `lib/cron/unix/parser.ts`, `tests/cron/unix-parser.test.ts`
- Modify: `next.config.mjs` (`output: 'export'`, `images.unoptimized: true`), `package.json` scripts (`test`, `typecheck`)

**Interfaces:**
- Produces (`lib/cron/types.ts`):
  - `type Dialect = 'unix'|'quartz'|'kubernetes'|'github'|'eventbridge'|'vercel'|'cloudflare'`
  - `type Issue = { field: string; message: string; severity: 'error'|'warning'|'info' }` (`field` ∈ `second|minute|hour|dayOfMonth|month|dayOfWeek|year|expression`)
  - `type Schedule = UnixSchedule | QuartzSchedule | RateSchedule` — `UnixSchedule = { kind:'unix'; raw:string; minutes:number[]; hours:number[]; doms:number[]; months:number[]; dows:number[]; domRestricted:boolean; dowRestricted:boolean }` (dows 0–6, 0=SUN; `7` normalised to 0). `QuartzSchedule` and `RateSchedule` are defined in Tasks 3 and 4.
  - `type ParseResult = { ok:true; schedule:Schedule; issues:Issue[] } | { ok:false; issues:Issue[] }`
- Produces: `parseUnix(expr: string): ParseResult` in `lib/cron/unix/parser.ts`.

- [x] **Step 1:** Scaffold: `pnpm dlx create-next-app@14 . --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-pnpm`; init shadcn with a CLI release that supports Tailwind 3 and add `button input select tabs badge`; `pnpm add croner date-fns date-fns-tz@3`; `pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @vitest/coverage-v8 @playwright/test`. `vitest.config.ts`: jsdom env, `@` alias, coverage thresholds 90 on `lib/cron/**`, 70 global.
- [x] **Step 2: Write failing tests** in `tests/cron/unix-parser.test.ts`:
```ts
it('parses 0 9 * * 1-5', () => { const r = parseUnix('0 9 * * 1-5'); expect(r.ok && r.schedule.kind==='unix' && r.schedule.dows).toEqual([1,2,3,4,5]) })
it('minute 60 error names field', () => { const r = parseUnix('60 * * * *'); expect(!r.ok && r.issues[0]).toMatchObject({field:'minute'}); expect(!r.ok && r.issues[0].message).toContain('0-59') })
it('wrong field count', () => { const r = parseUnix('* * * *'); expect(!r.ok && r.issues[0]).toMatchObject({field:'expression'}); expect(!r.ok && r.issues[0].message).toContain('expected 5 fields, got 4') })
it('names, steps, lists', () => { /* '*/15 9-17 * JAN-MAR MON,WED' → minutes [0,15,30,45], months [1,2,3], dows [1,3]; dow 7 → [0] */ })
it('flags restriction', () => { /* '0 0 13 * 5' → domRestricted && dowRestricted; '0 0 * * *' → neither */ })
it('parse_never_throws_on_garbage', () => { for (const s of ['', '   ', 'x'.repeat(10000), '😀 😀 😀 😀 😀', '<script>alert(1)</script>']) expect(() => parseUnix(s)).not.toThrow(); /* each is ok:false with an 'expression' or field error */ })
it('rejects @macros with a message', () => { expect(parseUnix('@daily').ok).toBe(false) })
```
- [x] **Step 3:** Run `pnpm vitest run tests/cron/unix-parser.test.ts` → Expected: FAIL, `parseUnix` not defined.
- [x] **Step 4:** Implement `parseUnix`: trim, split on whitespace, expand each field (`*`, `n`, `a-b`, `*/n`, `a-b/n`, comma lists, month/day names) into sorted unique number arrays, errors per field with the valid range in the message. Cap input length at 500 chars (error on `expression`).
- [x] **Step 5:** Run the test file → PASS; `pnpm typecheck && pnpm build` passes.
- [x] **Step 6:** Commit `feat: scaffold app and unix cron parser`.

---

### Task 2: Unix scheduler + DST matrix

**Files:**
- Create: `lib/cron/unix/scheduler.ts`, `lib/cron/unix/validator.ts`, `tests/cron/unix-scheduler.test.ts`

**Interfaces:**
- Consumes: `UnixSchedule` (Task 1).
- Produces:
  - `unixNextRuns(s: UnixSchedule, o: { tz: string; from: Date; count: number; until?: Date }): Date[]` — wraps `new Cron(s.raw, { timezone: o.tz })` and its `nextRuns`; stops at `until` or 8 years after `from`; may return fewer than `count`.
  - `unixDayMatches(s: UnixSchedule, y: number, m: number /*1-12*/, d: number): boolean` — OR semantics when both DOM and DOW are restricted.
  - `validateUnix(s: UnixSchedule): Issue[]` — error when no (month, dom) pair can ever exist (e.g. `0 0 31 2 *`; Feb 29 is allowed).

- [x] **Step 1: Write failing tests.** Use `from = new Date('2026-10-16T00:00:00Z')` unless stated. Pinned values:
```ts
'0 9 * * 1-5' tz Asia/Kolkata → runs[0] = 2026-10-16T03:30:00Z, runs[1] = 2026-10-19T03:30:00Z
'0 12 * * *' tz UTC → every run at 12:00Z, including across 2026-11-01
'0 12 * * *' tz America/New_York → 2026-10-30 run = 16:00Z; 2026-11-02 run = 17:00Z
'30 2 * * *' NY from 2026-03-07T00:00Z, until 2026-03-10Z → no run whose NY local time is 02:30 on 2026-03-08 (ledger what croner does: skip vs 03:30)
'30 1 * * *' NY from 2026-10-31T00:00Z until 2026-11-03Z → exactly one run on local date 2026-11-01 (ledger whether 05:30Z or 06:30Z)
London '30 1 * * *': gap 2026-03-29, overlap 2026-10-25 — same two assertions as NY
Sydney '30 2 * * *': gap 2026-10-04, overlap 2026-04-05; Auckland: gap 2026-09-27, overlap 2026-04-05
Asia/Tokyo and Asia/Kolkata: '0 9 * * *' local hour is 9 for all 25 runs
'0 0 13 * 5' UTC from 2026-11-01: runs include 2026-11-06 AND 2026-11-13 AND 2026-11-20
'0 0 31 2 *' → [] and call finishes in < 1000 ms; validateUnix returns an error issue
'0 0 29 2 *' → runs[0] = 2028-02-29T00:00:00Z, runs[1] = 2032-02-29T00:00:00Z
```
- [x] **Step 2:** Run `pnpm vitest run tests/cron/unix-scheduler.test.ts` → FAIL (not defined).
- [x] **Step 3:** Implement the three functions; `unixDayMatches` is plain set membership on `doms`/`dows`/`months`. Where the test says "ledger what croner does", assert the invariant given and record the observed behavior as a `Ruling:` — it feeds Task 6's DST wording.
- [x] **Step 4:** Run the test file → PASS.
- [x] **Step 5:** Commit `feat: unix scheduler and validator with DST tests`.

---

### Task 3: Quartz parser + validator

**Files:**
- Create: `lib/cron/quartz/symbols.ts`, `lib/cron/quartz/parser.ts`, `lib/cron/quartz/validator.ts`, `tests/cron/quartz-parser.test.ts`
- Modify: `lib/cron/types.ts` (add `QuartzSchedule`)

**Interfaces:**
- Produces:
  - `QuartzSchedule = { kind:'quartz'; raw:string; seconds:number[]; minutes:number[]; hours:number[]; dom: DomSpec; months:number[]; dow: DowSpec; years: number[]|null }` (`years` null = `*`). `DomSpec`/`DowSpec` are exported from `quartz/parser.ts` and must represent `?`, `*`, lists/ranges/steps, `L`, `L-n`, `LW`, `nW`, `nL`, `n#m`. Weekday numbers 1=SUN…7=SAT.
  - `parseQuartz(expr: string): ParseResult` — accepts 6 fields (no year) or 7.
  - `validateQuartz(s: QuartzSchedule): Issue[]`.
  - `QUARTZ_SYMBOL_HELP: Record<'?'|'L'|'W'|'#', string>` in `symbols.ts` (used by the formatter).

- [x] **Step 1: Write failing tests:**
```ts
parseQuartz('0 0 12 ? * MON-FRI').ok === true
parseQuartz('0 0 12 * * *') → error on field 'dayOfWeek' containing "?" (both DOM and DOW unspecified)
parseQuartz('0 0 12 1 * 2') → error mentioning '?' (both specified)
parseQuartz('0 0 12 L-3 * ?'), 'LW', '15W', '6#3', '6L', '*/10 * * * * ?', '0 0 12 ? * * 2026-2030' → ok
parseQuartz('0 0 12 32 * ?') → error field 'dayOfMonth'; '0 0 12 ? * 8' → error field 'dayOfWeek'; '0 0 12 ? * 6#6' → error
parseQuartz('0 0 12 ? * 2').ok && dow means MONDAY (assert parsed dow spec contains 2 and QUARTZ weekday 2 is Monday via helper)
parseQuartz('0 0 0 31 4 ?') → ok:true with validateQuartz issue 'never matches' (April has 30 days)
parse_never_throws_on_garbage: same 5 inputs as Task 1
```
- [x] **Step 2:** Run `pnpm vitest run tests/cron/quartz-parser.test.ts` → FAIL.
- [x] **Step 3:** Implement parser (field-by-field with ranges: sec/min 0–59, hour 0–23, dom 1–31, month 1–12/JAN–DEC, dow 1–7/SUN–SAT, year 1970–2199) and validator (never-match for impossible month/dom pairs and past-only years).
- [x] **Step 4:** Run → PASS.
- [x] **Step 5:** Commit `feat: quartz parser and validator`.

---

### Task 4: Quartz scheduler + EventBridge

**Files:**
- Create: `lib/cron/quartz/scheduler.ts`, `lib/cron/eventbridge/parser.ts`, `lib/cron/eventbridge/rate.ts`, `lib/timezone.ts` (minimal `localToUtc` now; the rest in Task 6), `tests/cron/quartz-scheduler.test.ts`, `tests/cron/eventbridge.test.ts`
- Modify: `lib/cron/types.ts` (add `RateSchedule = { kind:'rate'; raw:string; every:number; unit:'minute'|'hour'|'day' }`)

**Interfaces:**
- Consumes: `QuartzSchedule`, `parseQuartz` (Task 3).
- Produces:
  - `quartzDayMatches(s: QuartzSchedule, y: number, m: number, d: number): boolean`
  - `quartzNextRuns(s: QuartzSchedule, o: { tz: string; from: Date; count: number; until?: Date }): Date[]` — walk local calendar days from `from` (max 8 years), test `quartzDayMatches`, expand the sorted `hours × minutes × seconds` list, convert with `localToUtc(y,mo,d,h,mi,s,tz): Date` (`date-fns-tz` `fromZonedTime`), drop results `<= from`, de-duplicate instants.
  - `parseEventBridge(input: string): ParseResult` — accepts `cron(m h dom mon dow year)`, the bare 6 fields, or `rate(N unit)`. Cron is converted to a `QuartzSchedule` with `seconds=[0]`; rate yields `RateSchedule`.
  - `rateNextRuns(s: RateSchedule, o: { from: Date; count: number; until?: Date }): Date[]` — `from + k·interval`.

- [x] **Step 1: Write failing tests** (tz `UTC`; Quartz weekday 6 = FRI):
```ts
'0 0 12 L * ?'    from 2026-10-16 → runs[0] = 2026-10-31T12:00Z
'0 0 12 L-3 * ?'  from 2026-10-16 → runs[0] = 2026-10-28T12:00Z
'0 0 12 LW * ?'   from 2026-10-16 → runs[0] = 2026-10-30T12:00Z   // Oct 31 is Saturday
'0 0 12 15W * ?'  from 2026-10-16 → runs[0] = 2026-11-16T12:00Z   // Nov 15 is Sunday → Monday
'0 0 12 1W * ?'   from 2026-07-02 → runs[0] = 2026-08-03T12:00Z   // Aug 1 is Saturday → Monday, same month
'0 0 12 ? * 6#3'  from 2026-10-16T00:00Z → runs[0] = 2026-10-16T12:00Z
'0 0 12 ? * 6#5'  from 2026-10-16, count 2 → [2026-10-30T12:00Z, 2027-01-29T12:00Z]
'0 0 12 ? * 6L'   from 2026-10-16 → runs[0] = 2026-10-30T12:00Z
'*/10 * * * * ?'  count 25 → 25 runs, 10 s apart
'0 0 0 31 4 ?'    → [] in < 1000 ms
'0 30 2 * * ?' tz America/New_York around 2026-03-08 → no run at local 02:30 that day; around 2026-11-01 exactly one run for 01:30 variant
eventbridge: 'cron(0 12 * * ? *)' ok; 'cron(0 12 * * * *)' error (both dom/dow);
  'rate(5 minutes)' ok; 'rate(1 minutes)' error; 'rate(5 minute)' error; 'rate(1 minute)' ok
rateNextRuns 'rate(15 minutes)' from 2026-10-16T00:00Z → runs[0] = 2026-10-16T00:15Z
```
- [x] **Step 2:** Run `pnpm vitest run tests/cron/quartz-scheduler.test.ts tests/cron/eventbridge.test.ts` → FAIL.
- [x] **Step 3:** Implement as signatures above. The nonexistent-local-time case (02:30 in a gap) is dropped, not shifted; ledger the ruling.
- [x] **Step 4:** Run → PASS.
- [x] **Step 5:** Commit `feat: quartz scheduler and eventbridge support`.

---

### Task 5: Dialect layer, public API, conversion, compatibility

**Files:**
- Create: `lib/cron/dialects.ts`, `lib/cron/index.ts`, `lib/cron/compatibility.ts`, `tests/cron/dialects.test.ts`

**Interfaces:**
- Consumes: all engines above.
- Produces in `dialects.ts`: `DIALECTS: Record<Dialect, { label:string; family:'unix'|'quartz'|'eventbridge'; utcOnly:boolean; minIntervalMin?:number; docUrl:string }>`. Values: `github` utcOnly + minIntervalMin 5; `vercel`, `cloudflare`, `eventbridge` utcOnly; `kubernetes` not utcOnly; `unix`/`quartz` not utcOnly. `docUrl`: crontab(5) man page, Kubernetes CronJob docs, GitHub `on.schedule` docs, Vercel cron docs, Cloudflare Workers cron-triggers docs, AWS EventBridge scheduled-rule docs, Quartz CronTrigger tutorial (executor verifies each URL resolves when network is available; ledger if not).
- Produces in `index.ts`:
  - `parse(expr: string, dialect: Dialect): ParseResult` — routes by family; unix-family dialects share `parseUnix`, `eventbridge` uses `parseEventBridge`. Dialect warnings that need `tz` or runs (UTC-only, minimum interval) live in Task 8.
  - `nextRuns(s: Schedule, o: { tz: string; from: Date; count: number; until?: Date }): Date[]`
  - `dayMatches(s: Schedule, y: number, m: number, d: number): boolean` (rate: true)
  - `timeSets(s: Schedule): { seconds: number[]; minutes: number[]; hours: number[] }`
  - `frequency(s: Schedule, tz: string, from: Date): { perDay: number; perWeek: number; perMonth: number; perYear: number; matchingDays: number }` — walk 365 local days with `dayMatches`; `perYear = matchingDays × |sec|×|min|×|hour|` (rate: `perYear = 525600 / minutes`); `perDay = perYear/365`, `perWeek = perYear/52.1429`, `perMonth = perYear/12`.
- Produces in `compatibility.ts`:
  - `convertQuartzToUnix(expr: string): { ok: true; expr: string } | { ok: false; reason: string }` — safe only when seconds is `0`, year is `*`/absent, no `L`/`W`/`#`, and exactly one of DOM/DOW is `?`; weekday numbers shift by −1 (Quartz 1=SUN → 0).
  - `convertUnixToQuartz(expr: string): string` — `0 ` prefix, `?` in the unrestricted day field, weekday +1.
  - `type Badge = { label: string; ok: boolean }`; `compatibility(expr: string, dialect: Dialect): Badge[]` — one `"<Label> compatible"` badge per dialect (`ok` if `parse` succeeds directly or after a safe conversion) plus `Conversion requires manual review` (`ok:false`) when any dialect fails.

- [x] **Step 1: Write failing tests:**
```ts
convertQuartzToUnix('0 0 9 ? * 2')   → { ok:true, expr:'0 9 * * 1' }
convertQuartzToUnix('0 0 12 L * ?')  → { ok:false }
convertQuartzToUnix('*/10 * * * * ?') → { ok:false }   // seconds
convertUnixToQuartz('0 9 * * 1-5')   → '0 0 9 ? * 2-6'
frequency(parse('*/5 * * * *','unix'), 'UTC', 2026-10-16) perYear === 105120
frequency(parse('0 9 * * 1-5','unix'), 'UTC', 2026-10-16).matchingDays === 261   // weekdays in the 365 days starting 2026-10-16 (verify by counting in the test with a plain Date loop)
compatibility('0 9 * * 1-5','unix') contains { label:'Quartz compatible', ok:true } (via conversion) and no manual-review badge
compatibility('0 0 12 L * ?','quartz') contains { label:'Unix compatible', ok:false } and 'Conversion requires manual review'
```
- [x] **Step 2:** Run `pnpm vitest run tests/cron/dialects.test.ts` → FAIL.
- [x] **Step 3:** Implement per the signatures.
- [x] **Step 4:** Run `pnpm vitest run tests/cron` → all green; `pnpm typecheck` clean.
- [x] **Step 5:** Commit `feat: dialect layer, public cron API, conversion and badges`.

---

### Task 6: Timezone + DST utilities

**Files:**
- Create: `lib/dst.ts`, `tests/dst/dst.test.ts`
- Modify: `lib/timezone.ts`

**Interfaces:**
- Produces in `timezone.ts`: `browserTz(): string`; `isValidTz(tz: string): boolean` (try `new Intl.DateTimeFormat('en', {timeZone: tz})`); `listTzs(): string[]` (`Intl.supportedValuesOf('timeZone')` plus `'UTC'`); `formatLocal(d: Date, tz: string): string` (`YYYY-MM-DD HH:mm:ss z`); `formatUtc(d: Date): string` (`YYYY-MM-DD HH:mm:ss 'UTC'`).
- Produces in `dst.ts`:
  - `type Transition = { at: Date; kind: 'gap'|'overlap'; offsetBeforeMin: number; offsetAfterMin: number }`
  - `transitions(tz: string, from: Date, to: Date): Transition[]` — scan hourly with `getTimezoneOffset`, bisect to the minute.
  - `flagRun(run: Date, tr: Transition[]): 'dst-overlap' | null` — overlap if `run ∈ [at − Δ, at + Δ)`.
  - `dstWarnings(s: Schedule, tz: string, from: Date, to: Date): Issue[]` — for each transition, check the missing (gap) or repeated (overlap) local minutes against `dayMatches` and `timeSets`; warn "does not exist"/"occurs twice". Skip schedules whose hour set has 24 members (wildcard hours).

- [x] **Step 1: Write failing tests** (window 2026-01-01 → 2027-01-01):
```ts
transitions('America/New_York') → [gap 2026-03-08T07:00Z, overlap 2026-11-01T06:00Z]
transitions('Europe/London')    → [gap 2026-03-29T01:00Z, overlap 2026-10-25T01:00Z]
transitions('Australia/Sydney') → overlap 2026-04-04T16:00Z, gap 2026-10-03T16:00Z
transitions('Pacific/Auckland') → overlap 2026-04-04T14:00Z, gap 2026-09-26T14:00Z
transitions('Asia/Kolkata') → [];  transitions('Asia/Tokyo') → [];  transitions('UTC') → []
dstWarnings(parse('30 2 * * *','unix'), NY, …) has 1 warning containing 'does not exist'; '30 1 * * *' has 1 containing 'twice'
dstWarnings('*/30 * * * *', NY) → []
dstWarnings('30 2 * * *', 'Asia/Tokyo') → []
isValidTz('Not/AZone') === false; isValidTz('Asia/Kolkata') === true
```
- [x] **Step 2:** Run `pnpm vitest run tests/dst` → FAIL.
- [x] **Step 3:** Implement. If a pinned UTC instant disagrees with the real tz database, trust the database, fix the test and ledger a `Ruling:`.
- [x] **Step 4:** Run → PASS.
- [x] **Step 5:** Commit `feat: timezone helpers and DST detection`.

---

### Task 7: Formatter (explanations)

**Files:**
- Create: `lib/cron/formatter.ts`, `tests/cron/formatter.test.ts`

**Interfaces:**
- Consumes: `Schedule`, `Dialect`, `QUARTZ_SYMBOL_HELP`, `timeSets`.
- Produces: `explain(s: Schedule, dialect: Dialect, tz: string): Explanation` with `Explanation = { summary: string; fields: { name: string; raw: string; text: string }[]; notes: string[] }`. Own implementation, no `cronstrue` (it cannot describe `L/W/#`). Handles common shapes ("At 09:00, Monday through Friday"); anything else falls back to joining field texts.

- [x] **Step 1: Write failing tests:**
```ts
explain(unix '0 9 * * 1-5').summary === 'At 09:00, Monday through Friday'
explain(unix '*/15 9-18 * * *').summary contains 'every 15 minutes' and '09:00' and '18:59' or '18:45' (assert the summary mentions both 9 and 18)
explain(unix '0 0 1 * *').summary contains 'day 1 of the month'
explain(quartz '0 0 9 ? * 2').summary contains 'Monday'; notes contain a string with 'Quartz weekday numbering' and '1 = Sunday'
explain(quartz '0 0 12 L * ?').notes contains QUARTZ_SYMBOL_HELP.L;  '15W' → W help;  '6#3' → # help;  '?' → ? help
explain(quartz '*/10 * * * * ?').notes mention seconds; explain(quartz '… 2026-2030') notes mention year
explain(rate 'rate(5 minutes)').summary === 'Every 5 minutes'
fields length: unix 5, quartz 6 or 7
```
- [x] **Step 2:** Run `pnpm vitest run tests/cron/formatter.test.ts` → FAIL.
- [x] **Step 3:** Implement `explain`.
- [x] **Step 4:** Run → PASS.
- [x] **Step 5:** Commit `feat: plain-English formatter`.

---

### Task 8: Safety checks + analysis pipeline

**Files:**
- Create: `lib/cron/safety.ts`, `tests/cron/safety.test.ts`
- Modify: `lib/cron/index.ts` (export `analyze`)

**Interfaces:**
- Consumes: everything above.
- Produces:
  - `safetyChecks(s: Schedule, dialect: Dialect, tz: string, runs: Date[], now: Date): Issue[]` — rules: DOM+DOW both restricted in unix family → warning (`field:'dayOfMonth'`, message contains `OR`); no runs → error `never matches`; min gap between `runs` < 60 s → warning `excessively frequent`, < 5 min → info; github `minIntervalMin` violated → warning containing `5 minutes`; `utcOnly` and `tz !== 'UTC'` → warning containing `UTC`; all runs between 09:00–18:00 local and weekdays → info `business hours`; all runs Mon–Fri → info `weekday-only`; all Sat/Sun → info `weekend-only`; plus `dstWarnings`.
  - `analyze(i: { expr: string; dialect: Dialect; tz: string; now: Date; runCount: number }): Analysis` where `Analysis = { parse: ParseResult; runs: Date[]; explanation: Explanation | null; safety: Issue[]; badges: Badge[]; frequency: ReturnType<typeof frequency> | null; transitions: Transition[] }`. Invalid tz → treated as `UTC` with an `info` issue on field `expression`.

- [x] **Step 1: Write failing tests** (`now = 2026-10-16T00:00:00Z`):
```ts
analyze('0 0 13 * 5', unix, UTC).safety has warning with 'OR'; runs include 2026-11-06 and 2026-11-13   // Review Focus 5
analyze('0 0 31 2 *') → safety error 'never matches', runs [], explanation still present
analyze('* * * * * ?', quartz).safety has warning 'excessively frequent'
analyze('*/1 * * * *', github).safety has warning containing '5 minutes'
analyze('0 9 * * *', vercel, 'America/New_York').safety has warning containing 'UTC'; with tz 'UTC' it has none
analyze('0 9 * * 1-5', unix, UTC).safety has an info containing 'weekday-only'; analyze('*/15 9-17 * * 1-5') has one containing 'business hours'
analyze('0 9 * * *', unix, 'Not/AZone') → no throw; safety has info mentioning fallback to UTC
analyze('garbage') → parse.ok false, runs [], explanation null, no throw
```
- [x] **Step 2:** Run `pnpm vitest run tests/cron/safety.test.ts` → FAIL.
- [x] **Step 3:** Implement `safetyChecks` and `analyze`.
- [x] **Step 4:** Run `pnpm vitest run --coverage` → engine coverage ≥ 90%; add tests for any uncovered `lib/cron` branch before moving on.
- [x] **Step 5:** Commit `feat: safety checks and analysis pipeline`.

---

### Task 9: Exporters, builder, share URL

**Files:**
- Create: `lib/cron/exporter.ts`, `lib/cron/builder.ts`, `lib/share.ts`, `tests/exporter/exporter.test.ts`, `tests/cron/builder.test.ts`, `tests/share.test.ts`

**Interfaces:**
- Produces in `exporter.ts`:
  - `type ExportFormat = 'expression'|'kubernetes'|'github'|'vercel'|'eventbridge'|'cloudflare-toml'|'cloudflare-jsonc'|'explanation'`
  - `exportAs(format: ExportFormat, i: { expr: string; dialect: Dialect; tz: string; schedule: Schedule; explanation: Explanation }): { text: string; warnings: string[] }` — never throws. Quartz/EventBridge input is run through `convertQuartzToUnix` for unix-family targets; on failure `text: ''` and warning `Conversion requires manual review`. Non-UTC `tz` on utcOnly targets adds a UTC warning and leaves the expression unchanged.
    - kubernetes: commented `batch/v1` `CronJob` with `schedule`, `timeZone: <tz>`, `concurrencyPolicy: Forbid`, `successfulJobsHistoryLimit: 3`, `failedJobsHistoryLimit: 1`, placeholder container command, `restartPolicy: OnFailure`.
    - github: `on: schedule: - cron: '<expr>'` + `workflow_dispatch`, one job on `ubuntu-latest`, comment that cron runs in UTC.
    - vercel: `{ "crons": [{ "path": "/api/cron", "schedule": "<expr>" }] }` (limitations go in `warnings`, JSON has no comments).
    - eventbridge: `cron(m h dom mon dow *)` via `convertUnixToQuartz` (drop seconds), plus `rate(N minutes|hours|days)` only for `*/N * * * *` with N | 60, `0 */N * * *` with N | 24, `0 0 * * *` (`rate(1 day)`); warning that `rate` is not clock-aligned and that cron is UTC-only.
    - cloudflare-toml: `name = "my-worker"` + `[triggers]` + `crons = ["<expr>"]`; cloudflare-jsonc: equivalent JSON with a UTC comment.
- Produces in `builder.ts`: `type BuilderState = { frequency: 'minutes'|'hourly'|'daily'|'weekly'|'monthly'|'custom'; everyN: number; minute: number; hour: number; weekdays: number[]; dayOfMonth: number }`; `builderToExpr(b): string` (Unix 5-field; contiguous weekdays ≥ 3 as `a-b`); `exprToBuilder(expr: string): BuilderState | null`; `PRESETS: { id: string; label: string; expr: string }[]` with exactly: `*/5 * * * *`, `*/15 9-18 * * *`, `0 * * * *`, `0 9 * * *`, `0 9 * * 1-5`, `0 10 * * 1`, `0 0 1 * *`, and a custom entry.
- Produces in `share.ts`: `parseShareParams(search: string): { expr?: string; dialect?: Dialect; tz?: string; format?: ExportFormat; loaded: boolean }` (drops invalid values; `expr` ≤ 200 chars; `loaded` true only if `expr` survived); `toShareQuery(s: { expr: string; dialect: Dialect; tz: string; format: ExportFormat }): string`.

- [x] **Step 1: Write failing tests:**
```ts
exportAs('kubernetes', {expr:'0 9 * * 1-5', tz:'Asia/Kolkata', …}).text contains "schedule: \"0 9 * * 1-5\"" and "timeZone: \"Asia/Kolkata\"" and 'concurrencyPolicy: Forbid'  (+ toMatchSnapshot for the full text)
exportAs('github', …).text contains "- cron: '0 9 * * 1-5'" and 'workflow_dispatch'; tz 'Asia/Kolkata' → warnings has one containing 'UTC'; tz 'UTC' → warnings []
exportAs('vercel').text parses with JSON.parse → crons[0].schedule === expr
exportAs('eventbridge', '*/5 * * * *') → text contains 'cron(*/5 * * * ? *)' and 'rate(5 minutes)'; '*/7 * * * *' → no 'rate('
exportAs('kubernetes', quartz '0 0 12 L * ?') → text '' and warning 'Conversion requires manual review'
exportAs('cloudflare-toml').text contains 'crons = ["0 9 * * 1-5"]'; jsonc parses after stripping // comments
every PRESET (non-custom): parseUnix(p.expr).ok === true
builderToExpr(exprToBuilder(p.expr)!) === p.expr for all presets except '*/15 9-18 * * *', for which exprToBuilder → null
builderToExpr({frequency:'weekly', weekdays:[1,2,3,4,5], hour:9, minute:0, …}) === '0 9 * * 1-5'
parseShareParams('?expr=<script>x</script>&tz=Not/AZone&dialect=evil&format=x') → { tz: undefined, dialect: undefined, format: undefined, loaded: <true only if expr passes>, expr sanitized to a string never executed } and does not throw   // Review Focus 3: assert tz/dialect/format are undefined
parseShareParams('?tz=Not/AZone').loaded === false
toShareQuery then parseShareParams round-trips {expr:'0 9 * * 1-5', dialect:'unix', tz:'Asia/Kolkata', format:'kubernetes'}
```
- [x] **Step 2:** Run `pnpm vitest run tests/exporter tests/cron/builder.test.ts tests/share.test.ts` → FAIL.
- [x] **Step 3:** Implement per signatures.
- [x] **Step 4:** Run → PASS.
- [x] **Step 5:** Commit `feat: exporters, visual-builder logic and share-URL codec`.

---

### Task 10: State, hooks, theme, input UI

**Files:**
- Create: `context/CronContext.tsx`, `hooks/useCron.ts`, `hooks/useDebounce.ts`, `hooks/useTimezone.ts`, `components/cron-input.tsx`, `components/dialect-selector.tsx`, `components/timezone-selector.tsx`, `components/theme-toggle.tsx`, `components/copy-button.tsx`, `tests/components/cron-input.test.tsx`, `tests/components/state.test.tsx`
- Modify: `app/layout.tsx` (inline pre-hydration theme script; `<html suppressHydrationWarning>`), `app/globals.css` (semantic tokens: background, surface, border, text, success, warning, danger; light and dark)

**Interfaces:**
- Consumes: `analyze`, `parseShareParams`, `toShareQuery`, `convertQuartzToUnix`, `convertUnixToQuartz`, `isValidTz`, `browserTz`.
- Produces:
  - `AppState = { expr: string; dialect: Dialect; tz: string; nowOverride: string | null; format: ExportFormat; mode: 'builder'|'raw'; runCount: 25|50|100; fromShare: boolean }`
  - `Action = { type:'SET_EXPR'; expr:string } | { type:'SET_DIALECT'; dialect:Dialect } | { type:'SET_TZ'; tz:string } | { type:'SET_NOW'; value:string|null } | { type:'SET_FORMAT'; format:ExportFormat } | { type:'SET_MODE'; mode:'builder'|'raw' } | { type:'SET_RUN_COUNT'; n:25|50|100 } | { type:'HYDRATE'; patch:Partial<AppState> }`; `cronReducer(state, action): AppState` exported. `SET_DIALECT` between families converts via Task 5 helpers; if conversion is unsafe it keeps the text unchanged (the parse error/badges surface the mismatch).
  - `useDebounce<T>(value: T, ms: number): T`.
  - `useCron(): { state: AppState; dispatch: Dispatch<Action>; liveParse: ParseResult; analysis: Analysis; pending: boolean; nowIssue: string | null }` — `liveParse` from the undebounced expression (immediate syntax errors); `analysis` from the 150 ms-debounced state; `pending` true when debounced ≠ live for > 200 ms (renders "Calculating…"); invalid `nowOverride` → real now + `nowIssue` text; on mount applies `parseShareParams(location.search)`; URL kept in sync with `history.replaceState` (debounced, no history entries).
  - `data-testid` contract used by e2e: `cron-input`, `field-<second|minute|hour|dom|month|dow|year>`, `dialect-select`, `tz-input`, `now-input`, `theme-toggle`, `share-banner`, `copy-<format>`, `calculating`.
  - `CopyButton({ text, label, big?: boolean })` — inline checkmark 1.5–2 s; `big` also fires a brief toast; both announced through one `aria-live="polite"` region.
  - `cron-input.tsx` renders the raw input plus the always-visible per-field inputs (5/6/7 by dialect) kept in sync with the raw text, field-specific errors from `liveParse`, example chips (the PRESETS) and the dialect's `docUrl` link.

- [x] **Step 1: Write failing tests:**
```ts
cronReducer: SET_DIALECT quartz→unix on '0 0 9 ? * 2' → expr '0 9 * * 1'; on '0 0 12 L * ?' → expr unchanged
cronReducer: SET_TZ with 'Not/AZone' → tz unchanged (UTC fallback decided in useCron, state never holds an invalid tz)
render <CronInput/> in provider: typing '60 * * * *' shows an error containing '0-59' immediately (no timers advanced)
typing keeps focus on the input and caret position (assert document.activeElement and selectionStart after update)
editing field-minute to '*/5' updates raw input to '*/5 * * * *'
nowOverride 'garbage' → useCron().nowIssue is non-null and analysis.runs is non-empty (real now used)   // Review Focus 4
HYDRATE from '?expr=0+9+*+*+1-5&tz=Asia/Kolkata&dialect=unix' shows share-banner; '?tz=Not/AZone' shows none
CopyButton: click → checkmark visible, reverts after 2 s (fake timers); big → toast text in the live region
```
- [x] **Step 2:** Run `pnpm vitest run tests/components` → FAIL.
- [x] **Step 3:** Implement. Theme: `localStorage['cs.theme']` ∈ `light|dark|system`; the inline script sets `class="dark"` on `<html>` before paint; the toggle cycles all three.
- [x] **Step 4:** Run → PASS; `pnpm typecheck` clean.
- [x] **Step 5:** Commit `feat: app state, URL sync, theme and input UI`.

---

### Task 11: Builder, explanation, safety and export panels

**Files:**
- Create: `components/visual-builder.tsx`, `components/explanation-panel.tsx`, `components/safety-checks.tsx`, `components/export-panel.tsx`, `components/share-url.tsx`, `tests/components/panels.test.tsx`

**Interfaces:**
- Consumes: `useCron`, `builderToExpr`, `exprToBuilder`, `PRESETS`, `exportAs`, `CopyButton`, `toShareQuery`.
- Produces components with test ids: `preset-<id>` (ids = kebab labels from `PRESETS`), `frequency-select`, `explanation-summary`, `explanation-field-<name>`, `safety-<severity>` per issue, `badge-<ok|bad>` per compatibility badge, `export-tab-<format>`, `export-output`, `export-warning`, `copy-share-link`.
- Builder shows only the controls relevant to the chosen frequency; preset click dispatches `SET_EXPR` with the preset text (converted for Quartz/EventBridge through `convertUnixToQuartz`); non-representable expressions (`exprToBuilder` → null) show the builder as "Custom" without overwriting the raw text.

- [ ] **Step 1: Write failing tests:**
```ts
click preset-weekdays-at-9-00-am → cron-input value '0 9 * * 1-5' and explanation-summary text 'At 09:00, Monday through Friday'
every preset click yields a valid parse (no safety-error rendered)
choose frequency 'weekly' → weekday checkboxes visible; 'hourly' → weekday checkboxes absent
raw input '*/15 9-18 * * *' → builder displays Custom; raw text unchanged
export-tab-kubernetes shows output containing 'kind: CronJob'; export-tab-github with tz Asia/Kolkata shows export-warning containing 'UTC'
quartz '0 0 12 L * ?' + export-tab-kubernetes → export-output empty and warning 'Conversion requires manual review'
copy-share-link writes a URL containing 'expr=' to a mocked navigator.clipboard
empty expression → empty-state message rendered; invalid expression → error state rendered, panels do not crash
```
- [ ] **Step 2:** Run `pnpm vitest run tests/components/panels.test.tsx` → FAIL.
- [ ] **Step 3:** Implement the five components with shadcn primitives; badges/severity use semantic tokens plus an icon (never colour alone).
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat: builder, explanation, safety, export and share panels`.

---

### Task 12: Visualization (table, timeline, calendar, frequency)

**Files:**
- Create: `components/next-runs-table.tsx`, `components/timeline.tsx`, `components/calendar.tsx`, `components/frequency-summary.tsx`, `app/page.tsx`, `tests/components/viz.test.tsx`
- Modify: `app/page.tsx` assembles all panels; mobile-first layout, one column below `md`

**Interfaces:**
- Produces pure helpers exported from their component files: `timelineX(run: Date, from: Date, days: number, width: number): number`; `weekStartDefault(locale: string): 1|7` (reads `new Intl.Locale(locale).getWeekInfo?.().firstDay ?? weekInfo?.firstDay`, fallback 7); `monthGrid(year: number, month: number, weekStart: 1|7): { date: Date | null }[][]`.
- `NextRunsTable`: columns local time, UTC time, relative time, DST badge (`flagRun` → "ambiguous"); buttons `show-50`, `show-100` dispatch `SET_RUN_COUNT`.
- `Timeline`: SVG 7/14/30-day (`timeline-range-7|14|30`), day boundaries, now marker, DST transition markers, run dots (`title` + focusable with exact local and UTC time); computes up to 2000 runs via `nextRuns(..., { until })` and shows "Showing first 2,000 runs" beyond that (`shortcut: dot cap 2000, aggregate if users ask`).
- `Calendar`: month grid with prev/next, highlights days where `dayMatches`, today, DST-transition days and weekends; week-start selector persisted in `localStorage['cs.weekStart']`.
- `FrequencySummary`: perDay/perWeek/perMonth/perYear via `frequency`, formatted with `Intl.NumberFormat`.
- Local time and UTC are always shown side by side and labelled.

- [ ] **Step 1: Write failing tests:**
```ts
timelineX(from, from, 7, 700) === 0; timelineX(from+7d, from, 7, 700) === 700; timelineX(from+3.5d, …) === 350
weekStartDefault('en-US') === 7; weekStartDefault('en-GB') === 1; weekStartDefault('') falls back without throwing
monthGrid(2026, 10, 7)[0][0] is null or a Sunday; every row has 7 cells; contains 31 non-null dates
render table for '0 9 * * *' UTC: 25 rows (data-testid next-runs-row); click show-50 → 50 rows
render table with '30 1 * * *' tz America/New_York spanning 2026-11-01 now: one row shows an 'ambiguous' badge
Timeline for '* * * * *' renders ≤ 2000 dots and the cap note; '0 9 * * *' 7-day renders 7 dots
Calendar for '0 0 1 * *' highlights exactly one day in the displayed month
frequency summary for '*/5 * * * *' shows '105,120'
```
- [ ] **Step 2:** Run `pnpm vitest run tests/components/viz.test.tsx` → FAIL.
- [ ] **Step 3:** Implement. Keyboard: all dots, calendar days and buttons reachable by Tab; timeline scrolls horizontally on mobile.
- [ ] **Step 4:** Run → PASS; `pnpm vitest run` whole suite green; `pnpm build` passes.
- [ ] **Step 5:** Commit `feat: next-runs table, timeline, calendar and frequency summary`.

---

### Task 13: SEO pages, sitemap, OG images, offline

**Files:**
- Create: `lib/seo/expressions.ts`, `lib/seo/faqs.ts`, `app/cron-expression-explainer/page.tsx`, `app/quartz-cron-generator/page.tsx`, `app/kubernetes-cronjob-schedule-generator/page.tsx`, `app/cron-next-run-calculator/page.tsx`, `app/aws-eventbridge-cron-expression/page.tsx`, `app/cron-expression/[slug]/page.tsx`, `app/cron-expression/[slug]/opengraph-image.tsx`, `app/sitemap.ts`, `app/robots.ts`, `components/faq-jsonld.tsx`, `components/register-sw.tsx`, `public/sw.js`, `tests/seo.test.ts`
- Modify: `app/layout.tsx` (default metadata, Open Graph, Twitter card, `<RegisterSw/>`)

**Interfaces:**
- Produces:
  - `type SeoExpression = { slug: string; expr: string; dialect: Dialect; title: string; blurb: string }`; `SEO_EXPRESSIONS: SeoExpression[]` — exactly 30, kebab-case slugs (`every-5-minutes`, …), covering: every minute/5/15/30 min; hourly; nightly; weekday mornings; weekends; monthly; quarterly; common Quartz; Kubernetes; EventBridge. Must include `*/15 9-18 * * 1-5`, `0 9 * * 1`, `0 0 1 * *`, `0 9 * * 1-5`, `0 0 1 1 *`. (The requirement doc's example slugs such as `0-9-1-1-5` cannot be decoded unambiguously; slugs are explicit, ledger this as a `Ruling:`.)
  - `FAQS: Record<string, { q: string; a: string }[]>` keyed by landing-page path; hand-written, covering timezone, DST, Unix vs Quartz and platform questions.
  - Slug pages: `generateStaticParams()` returns the 30 slugs, `dynamicParams = false`, `generateMetadata` per slug, static explanation text from `explain()`, next-run examples computed at build from a fixed date, `FaqJsonLd` with `FAQPage` schema, link `/?expr=…&dialect=…` ("Open in Cron Studio").
  - `opengraph-image.tsx` (`next/og` `ImageResponse`): dark background, monospace expression, summary, product name; `generateStaticParams` over the same 30 slugs. `sitemap.ts` and `robots.ts` use `export const dynamic = 'force-static'` and list the 5 landing pages, 30 slug pages and `/`.
  - `public/sw.js`: runtime cache, same-origin GET only, network-first for navigations with cache fallback, cache-first for `/_next/static/*`; no precache list. `RegisterSw` registers it in production only.

- [ ] **Step 1: Write failing tests** in `tests/seo.test.ts`:
```ts
SEO_EXPRESSIONS.length === 30; new Set(slugs).size === 30
every entry: parse(expr, dialect).ok === true and runs > 0 from 2026-10-16T00:00Z
the 5 required expressions are present
every FAQ answer is non-empty; every landing path in sitemap() exists in the app directory
sitemap() returns 36 URLs (1 + 5 + 30)
```
- [ ] **Step 2:** Run `pnpm vitest run tests/seo.test.ts` → FAIL.
- [ ] **Step 3:** Implement data, pages, metadata, JSON-LD, sitemap, robots, OG route, service worker.
- [ ] **Step 4:** Run `pnpm vitest run tests/seo.test.ts` → PASS; `pnpm build` → completes and `out/cron-expression/every-5-minutes/index.html` exists, contains `application/ld+json`, and `out/sitemap.xml` + `out/robots.txt` exist. If `ImageResponse` cannot export statically, ledger a `Ruling:` and fall back to one static `public/og.png`.
- [ ] **Step 5:** Commit `feat: static SEO pages, sitemap, OG images and offline cache`.

---

### Task 14: E2E, CI, Lighthouse, docs

**Files:**
- Create: `playwright.config.ts`, `e2e/critical-paths.spec.ts`, `.github/workflows/ci.yml`, `lighthouserc.json`, `README.md`, `LICENSE` (MIT)
- Modify: `package.json` (`e2e` script serving `out/` via `pnpm dlx serve out -l 3000`)

**Interfaces:**
- Consumes: the `data-testid` contract from Tasks 10–12.

- [ ] **Step 1: Write the Playwright specs** (run against the static build; viewports desktop and `iPhone 13`):
```ts
enters '0 9 * * 1-5' → explanation-summary 'At 09:00, Monday through Friday' and 25 next-runs-row
clicks each preset → no safety-error and cron-input equals the preset expression
changes tz to Asia/Kolkata → first run row shows IST local time and the matching UTC time
DST: expr '30 2 * * *', tz America/New_York, now override 2026-03-07T00:00 → a safety-warning containing 'does not exist'
copies each export tab → clipboard text equals export-output text
loads '/?expr=0+9+*+*+1-5&tz=Asia/Kolkata&dialect=unix&format=kubernetes' → share-banner visible, kubernetes tab active, URL not duplicated in history (history.length unchanged after typing)
theme-toggle cycles system/light/dark; reload keeps choice; no flash (html has class before first paint)
mobile viewport: no horizontal page scroll (document.scrollingElement.scrollWidth <= innerWidth)
privacy: record all requests during a full interaction; every request origin equals the page origin
offline: load page, context.setOffline(true), reload → cron-input still renders
hostile URL '/?expr=<script>window.__x=1</script>&tz=Not/AZone&dialect=evil' → window.__x undefined, no share-banner
```
- [ ] **Step 2:** Run `pnpm build && pnpm exec playwright install --with-deps chromium && pnpm e2e` → FAIL on anything not yet wired; fix wiring in the component that owns it, not by loosening tests.
- [ ] **Step 3:** `ci.yml` jobs in order: pnpm install (frozen lockfile) → `typecheck` → `lint` → `vitest run --coverage` → `build` → Playwright → Lighthouse CI (`treosh/lighthouse-ci-action`, `staticDistDir: ./out`, assert performance/accessibility/best-practices/SEO ≥ 0.9). Trigger on `pull_request` and `push: main`. Vercel's Git integration provides PR previews and `main` production deploys (no workflow step); Lighthouse runs on the static build, not the preview URL — ledger as a `Ruling:`.
- [ ] **Step 4:** Verify budgets locally: `pnpm build` output "First Load JS" for `/` < 200 KB; if over, lazy-load Calendar and Timeline with `next/dynamic` and re-measure. Run Lighthouse locally against `out/` and confirm ≥ 90 in all four categories. `README.md`: purpose, privacy statement, scripts, deployment (Vercel; static hosts via `out/`), supported dialects, post-v1 list (natural-language input, schedule comparison, team sharing, monitoring, imports).
- [ ] **Step 5:** Run `pnpm typecheck && pnpm lint && pnpm vitest run --coverage && pnpm build && pnpm e2e` → all green, coverage thresholds met.
- [ ] **Step 6:** Commit `feat: e2e suite, CI, Lighthouse budgets and docs`.

---

## Self-Review

- **Spec coverage:** Formats/dialects → T1–5; input features (debounce, tz, now override, builder, two-way sync, advanced field editor, chips, docs links) → T9–11; explanation → T7, DOM/DOW OR → T8; visualization incl. DST → T6, T12; safety + badges + conversion warnings → T5, T8; exports + share URL → T9, T11; SEO/static/OG/FAQ → T13; UI/UX (theme, a11y, mobile, empty/error, copy feedback) → T10–12; testing matrix, coverage, CI, Lighthouse, bundle, offline, privacy → T1–14.
- **Known deviations (ledger as `Ruling:` when executing):** explicit SEO slugs; Lighthouse on static build instead of preview URL; `croner` DST behavior pinned by observation; wildcard-hour schedules skip DST warnings; UTC-only targets are warned, never shifted. Branch protection ("CI must pass before merge") is a repository setting the executor cannot apply; hand to the human.
- **Types:** `Issue`, `Schedule`, `Analysis`, `Transition`, `ExportFormat`, `AppState` are each defined once (T1, T3–4, T6, T8, T9, T10) and consumed with identical names.
