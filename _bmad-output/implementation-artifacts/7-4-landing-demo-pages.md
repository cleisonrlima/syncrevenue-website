# Story 7.4: Landing at `/v2` + DemoForm at `/demo`

Status: not-started

Epic: 7 — Figma 'teste' SaaS Import — Dashboard Suite + Dark Theme

Source: Figma Make file `https://www.figma.com/make/66Wb2MAv5PLOBSJLoFM3E3/teste`. Key files: `src/app/pages/Landing.tsx`, `src/app/pages/DemoForm.tsx`. Local references: placeholders authored in Story 7.2 (`src/pages/Landing.tsx`, `src/pages/Demo.tsx`).

Depends on: Story 7.1 (foundation, esp. react-slick + slick-carousel + lucide-react + motion) + Story 7.2 (routes + Navbar/Footer gating for `/v2`, `/demo`).

## Story

As a developer landing the marketing Landing variant + DemoForm route,
I want the Figma Landing (with the react-slick hero carousel, trust bar, benefits grid, security strip, CTA, footer) and the Figma DemoForm (with icon-prefixed inputs + post-submit motion confirmation panel) ported into `src/pages/Landing.tsx` and `src/pages/Demo.tsx` and mounted at `/v2` and `/demo`,
So that the dark-theme marketing surface and demo-capture flow are end-to-end navigable, complementing the existing light-theme `/` Home that stays untouched per Epic 7 decision 1.

## Acceptance Criteria

1. **Given** the Story 7.2 placeholder at `src/pages/Landing.tsx` (mounted at `/v2`) **When** the full Landing page is ported **Then** it renders: fixed nav with logo + 4 link pills (Products / Benefits / Security / Customers) + Login / "Book a Demo" CTAs, scroll-elevated nav background switch (`isScrolled` state, transparent → `bg-[#0A0A0A]/80 backdrop-blur-lg` after 20px scroll), mobile menu (AnimatePresence overlay with motion.div slide-in), hero `<Slider>` from react-slick (3 slides: revenue/pay/insights — each with badge / 2-line h1 / gradient highlight span / description / dual CTAs / 2 feature checkmarks / glass image panel with 2 floating motion cards), trust strip (5 agency logo placeholders), benefits grid (3 FeatureCard components), security strip (4 SOC2/Encryption/RBAC/Uptime tiles), large CTA block ("Ready to transform your revenue?"), footer (logo + 3 inline links + copyright year).

2. **Given** the react-slick carousel requires its CSS imports **When** Landing.tsx mounts **Then** the Figma `import 'slick-carousel/slick/slick.css'` and `import 'slick-carousel/slick/slick-theme.css'` are present at the page level (not global — keeps the slick CSS payload off `/`, `/privacy`, `/admin/*`). The inline `<style>` block from the Figma source (`.slick-dots li.slick-active div { background-color: white !important; width: 2rem !important; }`) is preserved verbatim — it's the only way to override slick's dot styling without a global stylesheet.

3. **Given** the Landing forces dark mode via `document.documentElement.classList.add('dark')` in a `useEffect` (Figma source line) **When** Story 7.1 has already set `<html class="dark">` globally **Then** the redundant `useEffect` is REMOVED from Landing.tsx (avoids a no-op re-add on every Landing mount). All other Landing useEffect hooks (scroll listener, etc.) stay.

4. **Given** the Story 7.2 placeholder at `src/pages/Demo.tsx` (mounted at `/demo`) **When** the full DemoForm is ported **Then** it renders: minimal nav (logo + "Back to Home" link), two-column hero (left: badge + h1 + 3 checkmark bullets; right: form card with First/Last Name + Work Email + Company Name + Phone fields, each with icon prefix from lucide-react), gradient submit button, post-submit `<motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}}>` success panel with CheckCircle2 green icon + "Request Received" heading + "Submit another request" reset link. `handleSubmit` calls `setSubmitted(true)` — real backend wiring is out of scope (real form submission lives at the existing `/` Home DemoForm via `useDemo` hook in Epic 2; Story 7.4's DemoForm is the visual port only, no backend wiring this story).

5. **Given** the existing Navbar + Footer are gated off `/v2` and `/demo` per Story 7.2 **When** these pages render **Then** they own their own chrome (Landing has its own dark nav + footer; DemoForm has its own minimal nav + no footer). Skip-to-content + ScrollRestoration remain functional via the App-level wrappers that DO render for these routes.

6. **Given** the Figma Landing has hardcoded English strings + "SyncSyrius" brand name **When** this story lands **Then** strings stay hardcoded English with "SyncSyrius" — Story 7.5 owns i18n extraction, Story 7.6 owns the brand+vocabulary rewrite. The structural port is complete and stable at this story.

7. **Given** the two new pages are additive **When** the existing test suite runs **Then** `npm run test:run` exits 0 (89-files / 772-passing baseline holds); a NEW Vitest spec `src/pages/Landing.test.tsx` asserts (a) the Landing renders without crash under `<MemoryRouter>`, (b) the hero h1 from the first slide is present (`screen.findByRole('heading', { level: 1 })`), (c) the trust strip is present; a NEW Vitest spec `src/pages/Demo.test.tsx` asserts the form fields render and `handleSubmit` flips to the success panel on submit.

## Tasks / Subtasks

- [ ] **Task 1: Port Landing.tsx (AC: 1, 2, 3)**
  - [ ] Copy Figma source verbatim → `src/pages/Landing.tsx`
  - [ ] Swap imports: `react-router` → `react-router-dom`; figma `ImageWithFallback` → local path
  - [ ] Move logo imports from `../../imports/1351_rev_*.jpg` to absolute `/logos/syncsirius-logo.png` (or whatever Story 6.2 established as canonical)
  - [ ] Remove the redundant `useEffect(() => document.documentElement.classList.add('dark'), [])` since Story 7.1 sets dark globally
  - [ ] Preserve the inline `<style>` block for slick-dots override
  - [ ] Smoke: scroll-listener cleanup on unmount, mobile menu open/close works
  - [ ] Co-located test `Landing.test.tsx` per AC 7

- [ ] **Task 2: Port Demo.tsx (AC: 4)**
  - [ ] Copy Figma source verbatim → `src/pages/Demo.tsx`
  - [ ] Swap imports as Task 1
  - [ ] Replace logo import path
  - [ ] Preserve the AnimatePresence + motion success-panel transition
  - [ ] `handleSubmit` stays at `setSubmitted(true)` — no API call this story
  - [ ] Co-located test `Demo.test.tsx` per AC 7

- [ ] **Task 3: Confirm Navbar/Footer gating from Story 7.2 (AC: 5)**
  - [ ] Manual smoke: `npm run dev`, navigate to `/v2` and `/demo`, confirm the existing public Navbar + Footer do NOT render (Story 7.2 should have already done this; Story 7.4 verifies)
  - [ ] If gating regressed, file a 5-line patch in this story's commit

- [ ] **Task 4: Asset wiring**
  - [ ] Confirm `/logos/syncsirius-logo.png` (or the canonical path) exists in `public/`. If not, copy from repo-root `1351_rev_1.jpg` and re-encode to webp at 32 + 64 + 128 px variants for the dark nav
  - [ ] Confirm `lucide-react` icons used by Landing (ArrowRight, BarChart3, ShieldCheck, Zap, CheckCircle2, Menu, X, PlayCircle, TrendingUp, LineChart, Wallet, Globe2) all resolve

- [ ] **Task 5: Test sweep (AC: 7)**
  - [ ] `Landing.test.tsx` + `Demo.test.tsx` pass
  - [ ] `npm run test:run` × 3 — exit 0
  - [ ] `npm run typecheck` exit 0
  - [ ] `npm run build` — verify slick CSS is bundled only for `/v2` chunk (`dist/client/assets/Landing-*.css`)

## Dev Notes

### Open reconciliations (resolve at create-time of story file → 2026-05-22)

1. **Final route path (`/v2` vs `/preview`).** Defaulted to `/v2` in Story 7.2. If user picks `/preview` instead, this story changes a single route registration line + the Landing internal CTAs `to="/dashboard"` and `to="/demo"` are unaffected (they don't reference the host page path).

2. **`react-slick` SSR compatibility.** react-slick does NOT support SSR cleanly (the slider initialises against `window`). Since Landing mounts at `/v2`, and `scripts/prerender.tsx` is updated by Story 7.7 to EXCLUDE `/v2` from prerender, this is a non-issue — Landing only renders client-side. If a future story adds Landing to the prerender path, this becomes blocking and needs a `useState(false)` mount guard wrapper.

3. **Hero LCP risk.** The hero carousel inline-loads 3 Unsplash hero images at 1080px. Mobile LCP on `/v2` will be poor without lazy/eager-priority hints. **Decision deferred:** Story 7.4 ports verbatim; Story 7.7 / 7.8 can flag this for a follow-up if Lighthouse on `/v2` falls below the 80 perf gate.

4. **Brand-name "SyncSyrius" + insurance copy preserved.** Story 7.6 owns the rewrite. Do NOT silently change copy here — the audit needs a single-story changeset.

### Out of scope

- i18n extraction — Story 7.5
- Brand-copy rewrite — Story 7.6
- Real form backend wiring — out of Epic 7
- Lighthouse / axe baselining for `/v2`, `/demo` — Story 7.7

### Subtasks land in Jira

Per CLAUDE.md, every task lands as a child Sub-task issue.
