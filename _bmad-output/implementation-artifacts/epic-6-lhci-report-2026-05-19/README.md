# Epic 6 LHCI Sweep — 2026-05-19

Story 6.12 deliverable. Captures the post-Epic-6 Lighthouse CI run against `/` and `/privacy` on both desktop and mobile form factors, three runs per URL.

## Observed scores

| Form factor | URL       | Perf      | A11y | BP   | SEO  | LCP (ms)         | CLS    | TBT (ms)   |
|-------------|-----------|-----------|------|------|------|------------------|--------|------------|
| desktop     | /         | (passing) | 0.95 | 0.96 | n/a  | (passing)        | 0.184  | (passing)  |
| desktop     | /privacy  | (passing) | 0.96 | 0.96 | n/a  | (passing)        | (low)  | (passing)  |
| mobile      | /         | 0.84–0.86 | 0.95 | 0.96 | 1.00 | 3,913–4,060      | 0.001  | 111–151    |
| mobile      | /privacy  | 0.98–0.99 | 0.96 | 0.96 | 1.00 | 1,955            | 0.000  | 32–107     |

Raw `lhr-*.json` and `lhr-*.html` are kept in this folder; the desktop run reports were overwritten by the mobile run in `.lighthouseci/`, so only mobile JSON survives here. The desktop summary above is reconstructed from the LHCI assertion log captured in `desktop/lhci-desktop.log`; the mobile log is in `mobile/lhci-mobile.log`.

## Baseline updates (per AC 2)

The pre-6.12 baselines in `lighthouserc.json` / `lighthouserc.mobile.json` were defined before the sober-palette refresh and the airplane hero background landed. Three categories regressed below baseline; each is rebaselined here with explicit rationale per AC 2 path (b).

| Config                     | Assertion                  | Old   | New   | Rationale |
|----------------------------|----------------------------|-------|-------|-----------|
| `lighthouserc.json`        | `categories:accessibility` | 1.00  | 0.95  | Lighthouse a11y category includes `color-contrast` (which our brand-deep body text token intentionally fails — documented R-A2 exception, also disabled in the axe Playwright sweep) plus `heading-order` (a moderate-severity finding the axe sweep does not flag as serious/critical). Axe sweep AC 4 still hits zero serious/critical on all 6 home-page sections. |
| `lighthouserc.json`        | `cumulative-layout-shift`  | 0.10  | 0.20  | Epic 6 introduced the integration ticker + hero panel motion. Observed CLS = 0.184 on desktop `/`. Optimisation deferred to follow-up story (motion-tuning + reserved-space pass). |
| `lighthouserc.mobile.json` | `categories:accessibility` | 1.00  | 0.95  | Same rationale as desktop. |
| `lighthouserc.mobile.json` | `categories:performance`   | 0.90  | 0.84  | Mobile perf regressed because the airplane hero background plus the JS-driven ticker push LCP past 2.5s on simulated mobile throttling. Stakeholder-approved visual direction; mobile-optim deferred. |
| `lighthouserc.mobile.json` | `largest-contentful-paint` | 2500  | 4100  | Same — observed 3913–4060 ms on mobile `/`. |

`render-blocking-resources` and `unused-javascript` remain `warn` — no change. Desktop CLS is the only desktop regression beyond a11y; desktop LCP/TBT continue to meet the prior thresholds.

## Follow-up story 6.13

The deferred items above are tracked in Story 6.13 (per CLAUDE.md "Review Findings → New Story"):
- LH `heading-order` audit fix on `/` and `/privacy`
- Desktop CLS optimisation (motion + reserved-space pass on hero + ticker)
- Mobile LCP optimisation (airplane hero asset weight / preload)
- Legacy i18n stragglers: `references.cta`, `forms.demo.*`, `forms.contact.*`

## Reproducing

```
npm run lhci          # desktop config
npm run lhci:mobile   # mobile config
```

Each command runs `npm run build && npx vite preview --port 4173 --strictPort` internally, then executes Lighthouse three times per configured URL.
