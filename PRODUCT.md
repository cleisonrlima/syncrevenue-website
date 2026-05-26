# Product

## Register

brand

## Secondary Register

product — `/dashboard/*` app UI uses product register. Override per task.

## Users

Finance directors, rate-desk leads, and mid-office operations teams at travel agencies. They work inside GDS interfaces all day (Amadeus, Sabre, Galileo, Worldspan, NDC, custom IBE). Their problem is invisible: commissions that should have been captured weren't — and they often don't know until reconciliation, if ever.

When they arrive at the SyncRevenue landing page, they are already skeptical. They've seen vendors overpromise. They want proof before they engage.

## Product Purpose

SyncRevenue automates commission auditing for travel agencies — catching discrepancies, BSP/ARC reconciliation failures, and missing revenue before ticket issuance. The measurable outcome: +15–20% commissions recovered, −40% debit memos, −65% QC errors.

Success means a finance director finishes the landing page visit thinking: "These people understand my problem and they've solved it."

## Brand Personality

Reliable · efficient · sharp

Voice: authoritative without being cold. Shows domain knowledge directly — no hand-holding, no jargon for its own sake. Respects the user's time and intelligence.

Emotional target on landing: **confidence** — authority first. Lead with credibility signals, accuracy metrics, and domain depth. The first 5 seconds should make a finance professional think "they know this space."

## References

- **Stripe / Linear** — dark backgrounds, sharp typography, data-forward credibility. The professional register to aim for.
- **Notion / Loom** — approachability within B2B. Product-demo screenshots up front, clear product benefit framing.
- **Bloomberg Terminal / Refinitiv** — finance-native density. Data is the content. Built for professionals who read numbers, not headlines.

The intersection: the precision of Stripe, the accessibility of Notion, the seriousness of Bloomberg.

## Anti-references

- **Gradient-heavy SaaS heroes** — purple-to-pink gradients, glassmorphism panels, glow blobs, gradient text. The 2023–2024 generic SaaS aesthetic. The existing `/v2` route leans into this; it should be treated as legacy, not direction.
- **Enterprise-bloated dashboards** — dense widget grids, too many KPI boxes at once, legacy BI tool aesthetics (old SAP / Oracle UI). Dense is fine; cluttered is not.
- **Airline / travel industry UI** — blue skies, vacation-adjacent imagery, airline portal aesthetics. This is a finance tool that happens to serve travel agencies, not a travel product.
- **Fintech navy-and-gold** — traditional financial services brochure energy, serif trust signals, banking-institution aesthetic.

## Design Principles

1. **Earn confidence before asking for it.** Lead with proof: accuracy numbers, integration coverage, how the system actually works. Claims without demonstration are noise to a finance professional.

2. **Finance-native density, not dashboard clutter.** Dense where professionals expect it (data tables, metrics strips, integration lists). Airy where comprehension needs space. Bloomberg earns density because every element carries signal — so should this product.

3. **Reliable means predictable.** Visual consistency over novelty. Every pattern should feel like a familiar professional tool, not a design experiment. Surprise belongs in the results, not the interface.

4. **Show, don't sell.** Product demonstrations over marketing claims. Show the interface, the reconciliation diff, the GDS integrations rather than abstract benefit headlines.

5. **Sharp means nothing wasted.** Every element earns its place. Tight hierarchy. No filler copy. No decorative elements that don't carry information. If it can be removed and the page still works, remove it.

## Accessibility & Inclusion

WCAG 2.1 AA target. Existing contrast waivers (R-A3: accent-on-navy AA Large only) are acceptable and tracked in `brand-tokens.contrast.manifest.ts`. Reduced-motion preference is respected via `MotionSection.tsx`. No new waivers without documenting rationale in the contrast manifest.
