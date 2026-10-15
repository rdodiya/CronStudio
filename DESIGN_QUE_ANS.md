```md
# Cron Studio — Design Decisions

## Resolved Questions

| # | Question | Decision | Rationale |
|---|---|---|---|
| 1 | Cron parsing library | **croner for Unix + custom Quartz parser** | `croner` is lightweight and TypeScript-friendly for Unix cron, next-run calculation, timezone handling, and DST-aware scheduling. It should not be treated as a complete Quartz parser, so Quartz-specific syntax such as `?`, `L`, `W`, `#`, seconds, and year fields needs a dedicated parser layer. |
| 2 | Visual builder approach | **Hybrid: Presets + Form-based** | Best UX for both beginners and developers. Presets remove the blank-canvas problem; the form keeps common schedules fast; the raw expression stays visible for developer trust and copyability. |
| 3 | Architecture | **Single Next.js app with `lib/cron` core** | Simplest path to launch. Keep parser, validator, scheduler, formatter, DST logic, and exporters as pure, testable modules. Extract npm packages only after a second product or public library need appears. |
| 4 | State management | **`useReducer` + Context + `useMemo`** | Zero extra dependencies and appropriate for a client-only SPA. Store user intent in reducer state; compute validation, explanation, next runs, and warnings with `useMemo`. |
| 5 | Visualization library | **Custom SVG timeline + CSS/HTML calendar** | Best performance and design control. A cron timeline and calendar are simple enough that Recharts or Chart.js would add unnecessary bundle weight. |
| 6 | Package manager | **pnpm** | Fast installs, efficient disk usage, strict dependency resolution, and good monorepo-readiness if the project grows later. |

---

## UI/UX Decisions

### 7. Default theme

**Decision:** System preference by default, with a manual light/dark toggle.

**UX rule:**

- Respect `prefers-color-scheme` on first visit.
- Persist the user’s manual choice in `localStorage`.
- Avoid a flash of incorrect theme by applying the saved theme before hydration.
- Default to a refined dark developer-tool aesthetic, but ensure light mode is equally polished.
- Use high-contrast semantic tokens for background, surface, border, text, success, warning, and danger.

**Why:** Developers expect dark mode, but forcing it hurts accessibility and general usability. System-first behavior is the most modern and respectful default.

---

### 8. Validation debounce

**Decision:** 150 ms debounce for expensive computations; immediate validation feedback for obvious syntax errors.

**UX rule:**

- Show field-level syntax errors immediately where possible.
- Debounce next-run calculation, calendar rendering, timeline rendering, and export generation by 150 ms.
- Show a subtle “Calculating…” state only if computation exceeds 200 ms.
- Never block typing.
- Preserve cursor position and input focus during updates.

**Why:** 150 ms feels responsive without recalculating the full schedule on every keystroke.

---

### 9. Maximum next runs shown

**Decision:** Show 25 by default, with “Show next 50” and “Show next 100” expansion options.

**UX rule:**

- Display the first 25 runs in a clean table or list.
- Include local time, UTC time, relative time, and DST warning badges.
- Use virtualization only if the user expands beyond 100 runs.
- Keep the default view lightweight and scannable.

**Why:** 25 is enough to understand a schedule; expandable options serve users debugging edge cases.

---

### 10. Timeline default range

**Decision:** 7 days by default, with 14-day and 30-day toggles.

**UX rule:**

- Default to a 7-day horizontal timeline.
- Show day boundaries, current-time marker, DST transition markers, and scheduled run dots.
- Make run markers hoverable/tappable to reveal exact local and UTC times.
- Allow horizontal scrolling on mobile.

**Why:** Seven days gives an immediately understandable rhythm without overwhelming the screen.

---

### 11. Calendar first day of week

**Decision:** Locale-aware first day of week using `Intl.Locale`.

**UX rule:**

- Use the browser locale to determine whether the week starts on Sunday or Monday.
- Allow the user to override it manually.
- Persist the override in `localStorage`.
- Highlight today, scheduled days, DST transition days, and weekend days subtly.

**Why:** Locale-aware calendars feel native and reduce cognitive friction for international users.

---

### 12. Copy button feedback

**Decision:** Inline checkmark first; toast only for export actions.

**UX rule:**

- For small copy actions, replace the copy icon with a green checkmark for 1.5–2 seconds.
- For larger exports such as YAML, JSON, or configuration blocks, show both an inline checkmark and a brief toast.
- Include accessible feedback using `aria-live="polite"`.
- Provide keyboard shortcuts such as `Cmd/Ctrl + C` only when the relevant output is focused.

**Why:** Inline feedback is less disruptive; toasts are useful only when the copied content is large or the action needs stronger confirmation.

---

### 13. Share URL format

**Decision:** Query parameters.

**Format:**

```text
[https://cronstudio.dev/?expr=0%209%20*%20*%201-5&tz=Asia%2FKolkata&dialect=unix&format=kubernetes](https://cronstudio.dev/?expr=0%209%20*%20*%201-5&tz=Asia%2FKolkata&dialect=unix&format=kubernetes)
```

**UX rule:**

- Update the URL using `history.replaceState` with debounced changes.
- Do not trigger unnecessary history entries while typing.
- Include expression, timezone, dialect, and selected export format.
- Sanitize and validate all URL parameters before applying them.
- Provide a “Copy share link” button.
- Show a small “Shared schedule loaded” banner when the app initializes from a share URL.

**Why:** Query parameters are shareable, bookmarkable, server-rendering friendly, and do not create unlimited dynamic paths.

---

## Export and Integration Decisions

### 14. Kubernetes YAML template

**Decision:** Full, production-ready template with helpful comments.

**Include:**

- `apiVersion`, `kind`, `metadata`
- `schedule`
- `timeZone`
- `concurrencyPolicy`
- `successfulJobsHistoryLimit`
- `failedJobsHistoryLimit`
- Placeholder container command
- Comments explaining each important field

**Why:** Developers should be able to paste, adjust the command, and deploy with confidence.

---

### 15. GitHub Actions workflow

**Decision:** Single-job workflow template.

**Include:**

- Minimal valid workflow structure
- `on.schedule.cron`
- `workflow_dispatch` for manual testing
- Sensible default runner
- Placeholder step
- Comments explaining UTC behavior

**Why:** GitHub Actions cron always runs in UTC, so the output should make that explicit. A single job is easier to understand and extend.

---

### 16. Vercel configuration format

**Decision:** `vercel.json`.

**Include:**

- Valid `crons` array
- Path to invoke
- Comment or helper text explaining Vercel’s cron limitations and UTC scheduling

**Why:** `vercel.json` is the standard, widely recognized configuration format for Vercel cron jobs.

---

### 17. AWS EventBridge format

**Decision:** Show both `rate()` and cron expression formats when applicable.

**UX rule:**

- Show cron expression output.
- Show `rate()` output only when the schedule can be represented as a simple rate.
- Clearly warn when a cron expression cannot be converted to `rate()`.
- Explain EventBridge’s UTC-only cron behavior.

**Why:** Users often do not know which EventBridge expression type they need. Showing both, with clear applicability rules, prevents confusion.

---

### 18. Cloudflare format

**Decision:** `wrangler.toml` as primary output, with `wrangler.jsonc` as an optional secondary format.

**Include:**

- `triggers.crons` configuration
- Placeholder worker name
- Comment explaining UTC scheduling
- Optional dashboard instructions

**Why:** `wrangler.toml` remains familiar and readable, while offering JSONC supports newer Cloudflare configuration preferences.

---

## SEO and Content Decisions

### 19. Expression explanation pages

**Decision:** Static generation at build time.

**Implementation:**

- Use `generateStaticParams()` for a curated expression allowlist.
- Generate metadata, FAQ schema, examples, and next-run explanation content at build time.
- Do not create pages for arbitrary user-submitted expressions.
- Use query parameters for user-specific shared schedules.

**Why:** Static generation is fastest, most SEO-friendly, safest, and fully compatible with a no-backend architecture.

---

### 20. Common expressions to include

**Decision:** Curated set of 30 high-value expressions at launch.

**Categories:**

- Every minute, 5 minutes, 15 minutes, 30 minutes
- Hourly and nightly schedules
- Weekday morning schedules
- Weekend schedules
- Monthly and quarterly schedules
- Common Quartz schedules
- Common Kubernetes schedules
- Common AWS EventBridge schedules

**Why:** Thirty curated pages are enough to cover high-intent searches without creating low-quality, repetitive content.

---

### 21. FAQ source

**Decision:** Manually curated FAQs.

**UX/content rule:**

- Answer real developer questions.
- Keep answers concise, accurate, and example-driven.
- Include timezone, DST, Unix vs Quartz, and platform-specific questions.
- Add FAQ structured data only where the content genuinely matches FAQ format.

**Why:** Manual curation produces higher-quality content and avoids generic AI-looking SEO pages.

---

### 22. Open Graph images

**Decision:** Generate OG images from static templates at build time.

**Design rule:**

- Use one consistent Cron Studio branded template.
- Show the expression, plain-English summary, and product name.
- Use dark background, high contrast, and monospace expression styling.
- Generate images for the 30 curated SEO pages.
- Do not generate OG images dynamically for arbitrary user expressions in v1.

**Why:** Build-time generation keeps hosting simple and avoids runtime image-generation costs.

---

## Testing and Quality Decisions

### 23. Test runner

**Decision:** Vitest.

**Why:** Fast, modern, native ESM support, excellent TypeScript support, and strong integration with Vite/Next.js ecosystems.

---

### 24. E2E testing

**Decision:** Playwright for critical paths.

**Critical flows:**

- Enter a valid cron expression and see explanation and next runs
- Use each visual-builder preset
- Change timezone and verify next-run output
- Trigger a DST edge case
- Copy each export format
- Load a shared URL
- Switch dark/light theme
- Use the app on mobile viewport

**Why:** Playwright covers real user journeys and cross-browser behavior better than component tests alone.

---

### 25. Coverage target

**Decision:** 90% coverage for `lib/cron`, 70% overall.

**Priority:**

1. Parser
2. Validator
3. Scheduler
4. DST utilities
5. Formatter
6. Exporter
7. UI components

**Why:** The cron engine is the product’s source of truth. UI coverage is useful, but engine correctness matters most.

---

### 26. DST test locations

**Decision:** Test key representative zones:

- `UTC`
- `Asia/Kolkata` — no DST
- `America/New_York` — US DST rules
- `Europe/London` — UK/EU-style DST rules
- `Australia/Sydney` — Southern Hemisphere DST
- `Pacific/Auckland` — another Southern Hemisphere DST zone
- `Asia/Tokyo` — no DST

**Why:** These zones cover DST, non-DST, Northern Hemisphere, Southern Hemisphere, and UTC-reference cases without trying to test every IANA zone.

---

## Deployment and DevOps Decisions

### 27. Deployment target

**Decision:** Vercel as the primary deployment target, with static export as a portable fallback.

**Rule:**

- Optimize for Vercel first.
- Keep the app compatible with static export.
- Avoid Vercel-specific APIs in core application logic.
- Ensure the app can be self-hosted on Cloudflare Pages, Netlify, GitHub Pages, or any static host.

**Why:** Vercel gives the best Next.js developer experience, while static compatibility preserves flexibility.

---

### 28. CI pipeline

**Decision:** GitHub Actions.

**CI jobs:**

1. Install dependencies with pnpm
2. Typecheck
3. Lint
4. Unit tests
5. Build
6. Playwright E2E tests
7. Lighthouse CI on preview deployment

**Why:** GitHub Actions is free for public repositories, widely supported, and integrates naturally with PR previews.

---

### 29. Preview deployments

**Decision:** Automatic preview deployment for every pull request.

**Rule:**

- Deploy previews for every PR.
- Run E2E tests against the preview when practical.
- Require CI to pass before merging to `main`.
- Deploy production automatically from `main`.

**Why:** Preview deployments make UI review, SEO checks, and regression testing much easier.

---

### 30. Analytics

**Decision:** No analytics in v1.

**Future option:**

- Add privacy-friendly, cookieless analytics later, such as Plausible, Umami, or Fathom.
- Do not use Google Analytics in v1.
- If analytics are added later, disclose them clearly and avoid collecting expression input as personal data.

**Why:** A privacy-first developer tool should not add tracking before it has a clear need.

---

## Advanced Features

### 31. Natural-language input

**Decision:** Post-v1.

**Future UX:**

- Add an optional “Describe schedule” input.
- Generate a suggested cron expression.
- Always show the generated expression, explanation, and next runs for confirmation.
- Never silently apply an ambiguous interpretation.

**Why:** Natural language is useful, but ambiguity can create wrong schedules. It should assist the visual builder, not replace it.

---

### 32. Schedule comparison

**Decision:** Post-v1.

**Future UX:**

- Allow users to paste two expressions.
- Show differences in field-level form.
- Show added, removed, and unchanged upcoming runs.
- Highlight DST and timezone differences.

**Why:** Useful for debugging changed production schedules, but not essential for launch.

---

### 33. Team sharing

**Decision:** Post-v1; requires backend.

**Why:** Collaborative editing introduces accounts, permissions, storage, and security concerns. It does not belong in the privacy-first v1.

---

### 34. Schedule monitoring

**Decision:** Post-v1; requires backend.

**Future product direction:**

- Monitor whether expected cron executions occur.
- Send alerts on missed, late, or duplicate runs.
- Offer webhook, email, or Slack notifications.

**Why:** This is a strong future paid feature, but it fundamentally changes Cron Studio from a client-only tool into a backend product.

---

### 35. Import from existing configuration

**Decision:** Post-v1.

**Future imports:**

- Kubernetes CronJob YAML
- GitHub Actions workflow YAML
- Vercel `vercel.json`
- Cloudflare Wrangler config
- AWS EventBridge rule JSON

**Why:** Import is valuable, but export and explanation are enough to prove value in v1.

---

## Final Confirmation

All recommended decisions are approved for v1:

- System-preference theme with manual toggle
- 150 ms debounce
- 25 next runs by default, expandable
- 7-day timeline default
- Locale-aware calendar
- Inline copy feedback, toast for large exports
- Query-parameter share URLs
- Full commented Kubernetes YAML
- Single-job GitHub Actions template
- `vercel.json`
- AWS EventBridge rate and cron formats
- Cloudflare `wrangler.toml` primary output
- Build-time static SEO pages
- Curated 30 expression pages
- Manually curated FAQs
- Build-time OG image generation
- Vitest, Playwright, 90% cron-engine coverage
- Key DST timezone test coverage
- Vercel-first deployment with static-export compatibility
- GitHub Actions CI with PR previews
- No analytics in v1
- Natural language, comparison, team sharing, monitoring, and imports deferred to post-v1
```