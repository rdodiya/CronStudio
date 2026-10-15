# Cron Studio - Design Questions & Decisions

## Resolved Questions

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| 1 | Cron parsing library | **croner** | Lightweight, Quartz support, good TypeScript |
| 2 | Visual builder approach | **Hybrid: Presets + Form-based** | Solves blank canvas, fast for common cases, two-way sync |
| 3 | Architecture | **Single Next.js app with lib/ folder** | Simpler, faster, easier deployment |
| 4 | State management | **useState/useReducer + Context** | Zero deps, sufficient for SPA |
| 5 | Visualization library | **Custom SVG/Canvas** | Lightweight, full control, no bundle bloat |
| 6 | Package manager | **pnpm** | Fast, disk-efficient, strict dependency resolution |

---

## Open Questions Requiring Decisions

### UI/UX Details

| # | Question | Options | Recommendation |
|---|----------|---------|----------------|
| 7 | Default theme | System preference / Light / Dark | **System preference** with manual toggle |
| 8 | Validation debounce | 100ms / 150ms / 300ms / On blur | **150ms** - responsive but not excessive |
| 9 | Max next runs to show | 10 / 25 / 50 / Configurable | **25** (requirement) with option to expand |
| 10 | Timeline view default | 7 days / 14 days / 30 days | **7 days** (requirement) |
| 11 | Calendar first day of week | Sunday / Monday / Locale | **Locale-aware** (Intl.Locale) |
| 12 | Copy button feedback | Toast / Inline checkmark / Both | **Inline checkmark + toast** |
| 13 | Share URL format | Query params / Hash / Path | **Query params** - `?expr=...&tz=...&format=...` |

### Export & Integration

| # | Question | Options | Recommendation |
|---|----------|---------|----------------|
| 14 | Kubernetes YAML template | Minimal / Full with comments | **Full with comments** - more helpful |
| 15 | GitHub Actions workflow | Single job / Matrix example | **Single job** (simpler, user can extend) |
| 16 | Vercel config format | vercel.json / vercel.yml | **vercel.json** (more common) |
| 17 | AWS EventBridge format | Rate + Cron / Cron only | **Both** - show both formats |
| 18 | Cloudflare format | wrangler.toml / wrangler.json / Dashboard UI | **wrangler.toml** (standard) |

### SEO & Content

| # | Question | Options | Recommendation |
|---|----------|---------|----------------|
| 19 | Expression explanation pages | Static generation / ISR / On-demand | **Static generation** at build time |
| 20 | Common expressions to include | Top 20 / Top 50 / Curated 30 | **Curated 30** - most useful patterns |
| 21 | FAQ source | Manual / Generated from common questions | **Manual curation** for quality |
| 22 | Open Graph images | Generated / Static templates | **Generated** with expression preview |

### Testing & Quality

| # | Question | Options | Recommendation |
|---|----------|---------|----------------|
| 23 | Test runner | Vitest / Jest | **Vitest** (faster, native ESM) |
| 24 | E2E testing | Playwright / Cypress / None | **Playwright** for critical paths |
| 25 | Coverage target | 80% / 90% / 95% | **90% on cron engine**, 70% overall |
| 26 | DST test locations | US/EU/AU / All IANA / Key zones | **Key zones**: America/New_York, Europe/London, Australia/Sydney, Asia/Tokyo |

### Deployment & DevOps

| # | Question | Options | Recommendation |
|---|----------|---------|----------------|
| 27 | Deployment target | Vercel / Netlify / Static (any) / Docker | **Vercel** (native Next.js) + static export option |
| 28 | CI pipeline | GitHub Actions / GitLab / None | **GitHub Actions** |
| 29 | Preview deployments | Every PR / Main only / Manual | **Every PR** |
| 30 | Analytics | None / Plausible / GA4 / Custom | **None** (privacy-first, v1) |

### Advanced Features (Post-v1)

| # | Question | Options | Recommendation |
|---|----------|---------|----------------|
| 31 | Natural language input | "Every weekday at 9am" → cron | **Post-v1** - high complexity, low reliability |
| 32 | Schedule comparison | Diff two expressions | **Post-v1** |
| 33 | Team sharing | Collaborative editing | **Post-v1** - requires backend |
| 34 | Schedule monitoring | Webhook notifications on runs | **Post-v1** - requires backend |
| 35 | Import from existing | Paste Kubernetes YAML, GitHub workflow | **Post-v1** - nice to have |

---

## Questions for User Confirmation

Please review and confirm the **Recommendation** column, or specify your preference:

1. **Theme default**: System preference with manual toggle?
2. **Validation debounce**: 150ms?
3. **Share URL format**: Query parameters?
4. **Kubernetes YAML**: Full with comments?
5. **GitHub Actions**: Single job template?
6. **Vercel config**: vercel.json?
7. **AWS EventBridge**: Both rate and cron formats?
8. **Cloudflare**: wrangler.toml?
9. **SEO pages**: Static generation at build time?
10. **Common expressions**: Curated 30 most useful?
11. **Test runner**: Vitest?
12. **E2E testing**: Playwright for critical paths?
13. **Coverage**: 90% on cron engine?
14. **DST test zones**: NY, London, Sydney, Tokyo?
15. **Deployment**: Vercel with static export option?
16. **CI**: GitHub Actions with PR previews?
17. **Analytics**: None (privacy-first)?

---

## Design Approval Checklist

- [ ] Architecture approach confirmed
- [ ] Core library choices confirmed
- [ ] UI/UX approach confirmed
- [ ] Export formats confirmed
- [ ] SEO strategy confirmed
- [ ] Testing strategy confirmed
- [ ] Deployment strategy confirmed
- [ ] All open questions resolved

**Next Step:** Once all questions are resolved, I'll write the detailed design specification and then create the implementation plan.