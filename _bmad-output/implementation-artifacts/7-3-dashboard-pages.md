# Story 7.3: Dashboard Pages — Overview, Revenue Recovery, Payouts, Insights, Settings

Status: not-started

Epic: 7 — Figma 'teste' SaaS Import — Dashboard Suite + Dark Theme

Source: Figma Make file `https://www.figma.com/make/66Wb2MAv5PLOBSJLoFM3E3/teste`. Key files: `src/app/pages/DashboardHome.tsx`, `src/app/pages/RevenueRecovery.tsx`, `src/app/pages/Payouts.tsx`, `src/app/pages/Insights.tsx`, `src/app/pages/Settings.tsx`. Local references: placeholders authored in Story 7.2 (`src/pages/dashboard/*.tsx`).

Depends on: Story 7.1 (foundation deps incl. recharts + lucide-react + 13 radix packages) + Story 7.2 (routes + DashboardLayout shell).

## Story

As a developer landing the dashboard product surface,
I want the five Figma dashboard pages (Overview, Revenue Recovery, Payouts, Insights, Settings) ported into `src/pages/dashboard/` consuming the foundation tokens and the `DashboardLayout` outlet,
So that the dashboard suite renders end-to-end at `/dashboard`, `/dashboard/recovery`, `/dashboard/payouts`, `/dashboard/insights`, `/dashboard/settings` with charts, tables, tabs, filters, and form sub-tabs all functional against the Figma mock data.

## Acceptance Criteria

1. **Given** the Story 7.2 placeholder at `src/pages/dashboard/DashboardHome.tsx` **When** the full Overview page is ported **Then** it renders: page header (`Overview` + subline), 3-card metric row (Total Recovered / Active Discrepancies / Payouts Processed — each with ArrowUpRight/ArrowDownRight trend + lucide icon), an AreaChart with linearGradient defs for `colorRecovered` (indigo `#818cf8`) + `colorBaseline` (slate `#94a3b8`) consuming `REVENUE_DATA` (7 months Jan–Jul with `recovered` + `baseline` series), a `<select>` filter (Last 7 Months / This Year / All Time), and a Recent Discrepancies side card (4 mock rows with status pills + delta + View All button). All recharts components rendered via `ResponsiveContainer` so they scale to container. Hardcoded English copy + mock data are intentional (i18n in Story 7.5, brand copy rewrite in Story 7.6).

2. **Given** the Story 7.2 placeholder at `src/pages/dashboard/RevenueRecovery.tsx` **When** the full Revenue Recovery page is ported **Then** it renders: page header (with Export Report + New Dispute primary CTAs), 3-card metric row (Unrecovered / In Dispute / Recovered YTD with AlertTriangle / Clock / CheckCircle icons), tab filter (`All Discrepancies` / `Action Required` / `Disputed` / `Resolved` with a count badge on Action Required), search input, filter button, full data table (8 columns: Carrier & Policy / Client / Expected / Actual / Delta / Type / Status / Actions) consuming `DISCREPANCIES` (7 mock rows), per-tab filtering via `useState`, status pills with the 3 status-color rules, hover-reveal MoreHorizontal action button, pagination footer (Previous / Next). Empty-state row when filtered list is empty.

3. **Given** the Story 7.2 placeholder at `src/pages/dashboard/Payouts.tsx` **When** the full Payouts page is ported **Then** it renders: page header (Export + "Run Payout Cycle" primary CTA with shadow ring), 3-card metric row (Total Processed MTD / Pending Payouts / Failed Transactions — each with gradient-corner glow at hover via group hover), tab filter (5 tabs incl. Processing count badge), search + filter, data table (6 columns: Agent w/ initials avatar / Date / Amount / Method w/ Landmark icon / Status pill w/ icon / Actions), per-tab filtering, empty-state row, pagination footer.

4. **Given** the Story 7.2 placeholder at `src/pages/dashboard/Insights.tsx` **When** the full Insights page is ported **Then** it renders: page header (with 2026 Financial Year pill + Export CTA), 4-card metric row (Global Revenue / Forecasted EOY / Average Margin / Active Territories — each with lucide icon + colored bg glow), main forecast LineChart (12-month, actual line + dashed forecast line, both at color `#f59e0b`), and a 3-card row (Regional Distribution PieChart w/ inner-radius donut + center label + legend; Product Lines vertical BarChart w/ per-bar Cell color based on growth sign; Top Agents ranked list). All charts via `ResponsiveContainer`.

5. **Given** the Story 7.2 placeholder at `src/pages/dashboard/Settings.tsx` **When** the full Settings page is ported **Then** it renders: page header (with Save Changes primary CTA that flips to "Saved Successfully" green state for 2s after click), left sidebar tab list (6 tabs: General Profile / Team Members / Security & API / Billing & Plans / Integrations / Notifications), right content area that swaps between 6 sub-components (`GeneralSettings`, `TeamSettings`, `SecuritySettings`, `BillingSettings`, `IntegrationsSettings`, `NotificationSettings`). Each sub-component renders the full Figma layout (icon-prefixed inputs, Danger Zone, team table, 2FA + password rows, API key with blur-on-hover-reveal, billing plan card with payment method row, integration grid 2×2 with connect/disconnect toggle, notification toggle switches).

6. **Given** the five dashboard pages are additive **When** the existing test suite runs **Then** `npm run test:run` exits 0 (89-files / 772-passing baseline holds); a NEW Vitest spec per page (`DashboardHome.test.tsx`, `RevenueRecovery.test.tsx`, `Payouts.test.tsx`, `Insights.test.tsx`, `Settings.test.tsx`) asserts (a) the page renders without crashing under `<MemoryRouter>` + `<DashboardLayout>`, (b) the primary heading is present (e.g., `screen.findByRole('heading', { name: /Overview/ })`), (c) for pages with tabs/filters, switching tabs updates the rendered rows; full a11y axe scan deferred to Story 7.8.

## Tasks / Subtasks

- [ ] **Task 1: Port DashboardHome.tsx (AC: 1)**
  - [ ] Copy Figma source verbatim → `src/pages/dashboard/DashboardHome.tsx`
  - [ ] Swap imports: `react-router` → `react-router-dom`; figma `ImageWithFallback` → local path; `cn` from `@/lib/cn`
  - [ ] Mock data (`REVENUE_DATA`, `DISCREPANCIES`) inlined; mark with `// TODO(epic-8): wire to real data` comment
  - [ ] Verify recharts AreaChart renders under dark theme tokens (Tooltip contentStyle uses `#1A1A24` bg — keep as inline style)
  - [ ] Co-located test `DashboardHome.test.tsx` covers AC6 (a) + (b)

- [ ] **Task 2: Port RevenueRecovery.tsx (AC: 2)**
  - [ ] Copy verbatim with import swaps as Task 1
  - [ ] Preserve `useState<string>('Action Required')` initial tab + `useMemo`/`filter` derived list pattern
  - [ ] Co-located test asserts tab-switch updates row count

- [ ] **Task 3: Port Payouts.tsx (AC: 3)**
  - [ ] Copy verbatim with import swaps
  - [ ] Preserve initials-from-name pattern `row.agent.split(' ').map(n => n[0]).join('')`
  - [ ] Co-located test covers AC6 (a) + (c) tab-switch

- [ ] **Task 4: Port Insights.tsx (AC: 4)**
  - [ ] Copy verbatim with import swaps
  - [ ] Preserve all 4 chart types (Line/Pie/Bar) + inline color hex literals (will become tokens in a later epic; for Epic 7 they stay inline)
  - [ ] Co-located test covers AC6 (a) + (b)

- [ ] **Task 5: Port Settings.tsx + 6 sub-components (AC: 5)**
  - [ ] Top-level `Settings.tsx` with tab state machine + 6 conditional sub-renders
  - [ ] Sub-components either inline in the same file (matches Figma source — single-file pattern) OR split into `src/pages/dashboard/settings/{General,Team,Security,Billing,Integrations,Notifications}Settings.tsx` — pick one based on file-size pragma; Figma source is single-file at ~400 lines, acceptable to keep single-file.
  - [ ] Preserve `setIsSaved` 2s toast pattern
  - [ ] Co-located test covers AC6 (a) + tab-switch (b)

- [ ] **Task 6: Test sweep (AC: 6)**
  - [ ] All 5 new test files pass
  - [ ] `npm run test:run` × 3 — exit 0
  - [ ] `npm run typecheck` exit 0
  - [ ] `npm run dev` smoke: visit each `/dashboard/*` route, confirm charts + tables render
  - [ ] Note: Lighthouse / axe deferred to Story 7.7 (regression sweep) + Story 7.8 (per-route axe scan)

## Dev Notes

### Open reconciliations (resolve at create-time of story file → 2026-05-22)

1. **Mock data field names retain Figma vocabulary (carrier, policy, clawback).** Story 7.6 is the single chokepoint for the brand-copy + domain-vocabulary swap to travel-commission terms. Do NOT change `DISCREPANCIES[i].carrier → gds` here — that would split the audit across two stories and create review-trail confusion. Story 7.3's job is the structural port; Story 7.6's job is the substantive rewrite.

2. **Inline color hex literals in chart configs.** Figma source has `stroke="#818cf8"`, `fill="#8b5cf6"`, etc. for chart series. These are valid chart-palette values per the Figma `--chart-1..5` token set. **Resolution:** keep inline hex for Epic 7; flag a future story to migrate to `var(--chart-N)` tokens via the recharts theme prop (out of scope for Epic 7).

3. **`React, useState` imports.** Figma source imports `React, { useState }` everywhere. With React 18 + new JSX transform, the `React` default import is unnecessary. **Resolution:** drop the redundant `React` import as part of the port (`eslint-rules/react-in-jsx-scope` if installed will enforce; if not, manual cleanup).

4. **Settings page form fields use `defaultValue`.** Per the existing `eslint-rules/no-default-value-on-controlled-input` lint rule (Story 3.10), this might trigger. Audit on port: if the rule flags uncontrolled-with-defaultValue, accept (these are intentional uncontrolled inputs — no `value` prop in source) OR convert to controlled if Story 3.10 rule disallows uncontrolled entirely. Decision lives in the story Dev Agent Record.

### Out of scope

- Real data wiring — out of Epic 7 entirely
- i18n extraction — Story 7.5
- Brand copy + domain vocabulary rewrite — Story 7.6
- Dark mode regression sweep on EXISTING pages — Story 7.7
- Lighthouse / axe per new page — Story 7.8

### Subtasks land in Jira

Per CLAUDE.md, every task above lands as a child Sub-task issue under the parent Story Jira issue at create-time.
