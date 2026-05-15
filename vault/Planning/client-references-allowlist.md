# Client References Allowlist

**Purpose:** Single source of truth for which agency names may appear in `references.items[*].agencyName` across all locales (EN, PT-BR, ES).

**Enforcement:** `src/components/sections/ClientReferences.allowlist.test.tsx` asserts every rendered `agencyName` from `t('references.items')` exists in the `APPROVED` set below. Any name flagged `[PLACEHOLDER]` here is allowed in development / preview builds but **fails the test in `production` mode** (`process.env.NODE_ENV === 'production'`).

**Owner:** Pri (Project Lead) authorizes additions. Alice (PM) maintains the list. Engineering edits the translation JSON only after this file is updated.

**Source of risk:** Test Design Epic 1, R-B1 (Score 6) — placeholder agency names from Story 1.9 must not ship to production unchanged.

---

## APPROVED (production-ready)

_None yet — all current entries are placeholders authorized for pre-prod only._

---

## PLACEHOLDER (pre-prod only — must be replaced before production deploy)

| Name | Locales using it | Authorized by | Authorized on | Replacement deadline |
| ---- | ---------------- | ------------- | ------------- | -------------------- |
| Atlas Travel Group `[PLACEHOLDER]` | EN, PT-BR, ES | Pri | 2026-05-15 | Before Epic 5 (Production Deployment) |
| Pacific Sun Voyages `[PLACEHOLDER]` | EN, PT-BR, ES | Pri | 2026-05-15 | Before Epic 5 |
| Northstar Travel Partners `[PLACEHOLDER]` | EN, PT-BR, ES | Pri | 2026-05-15 | Before Epic 5 |

---

## Update procedure

1. PM obtains explicit written approval from the referenced agency (email, contract clause, or signed reference agreement).
2. PM moves the row from PLACEHOLDER → APPROVED and removes the `[PLACEHOLDER]` marker.
3. Engineering updates `src/i18n/locales/{en,pt-BR,es}/translation.json` `references.items[*].agencyName` to the approved spelling.
4. PR must update this file **and** all three translation files atomically.
5. `npm run test:run -- ClientReferences.allowlist.test.tsx` must pass before merge.

## Rejection procedure

If a referenced agency declines:

1. Remove the row from both PLACEHOLDER and APPROVED.
2. Replace the entry in the translation JSON with the next-priority placeholder OR remove the entry entirely.
3. Confirm the section still renders meaningfully with fewer references; otherwise hide the entire ClientReferences section via feature flag.

---

## Test ID

`R-B1` in `_bmad-output/test-artifacts/test-design/test-design-epic-1.md`.

## Related

- Story 1.9 implementation: `_bmad-output/implementation-artifacts/1-9-security-client-references-sections.md`
- PRD FR24: "Visitors can view client references from recognized US travel agencies as social proof."
- Story 1.9 carry-over noted in `vault/00-Home.md` known debt.
