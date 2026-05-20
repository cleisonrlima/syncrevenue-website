---
workflowStatus: 'complete'
totalSteps: 5
stepsCompleted: ['step-01-detect-mode', 'step-02-load-context', 'step-03-risk-and-testability', 'step-04-coverage-plan', 'step-05-generate-output']
lastStep: 'step-05-generate-output'
nextStep: ''
lastSaved: '2026-05-20'
mode: 'epic-level'
scope: 'epic-5-v2-re-pass'
inputDocuments:
  - '_bmad-output/test-artifacts/test-design/test-design-epic-5.md'
  - '_bmad-output/implementation-artifacts/sprint-status.yaml'
  - '_bmad-output/implementation-artifacts/5-1-production-build-pm2-process-management.md'
  - '_bmad-output/implementation-artifacts/5-2-domain-configuration-ssl-tls.md'
  - '_bmad-output/implementation-artifacts/5-3-environment-variable-hardening.md'
  - '_bmad-output/implementation-artifacts/5-4-sqlite-backup-automation.md'
  - '_bmad-output/implementation-artifacts/5-5-uptime-monitoring-health-check.md'
  - '_bmad-output/implementation-artifacts/5-6-mobile-lcp-ssg-prerender-hero.md'
  - '_bmad-output/implementation-artifacts/5-7-pm2-cluster-mode-multi-core.md'
  - '_bmad-output/implementation-artifacts/5-8-prerender-script-type-coverage.md'
  - '_bmad-output/implementation-artifacts/5-9-express-trust-proxy-configuration.md'
  - '_bmad-output/implementation-artifacts/5-10-ci-quality-gate-build-artifact-coverage.md'
  - '_bmad-output/implementation-artifacts/5-11-health-dao-unit-tests.md'
  - '_bmad-output/implementation-artifacts/epic-5-retro-2026-05-20.md'
  - '.github/workflows/quality.yml'
  - 'server/index.ts'
  - 'server/dao/health.dao.test.ts'
  - 'scripts/test-build-output.mjs'
  - 'scripts/generate-seo-assets.test.mjs'
  - 'vite.config.ts'
  - 'ecosystem.config.js'
  - 'tsconfig.scripts.json'
  - 'docs/deployment-runbook.md'
  - 'resources/knowledge/risk-governance.md'
  - 'resources/knowledge/probability-impact.md'
  - 'resources/knowledge/test-levels-framework.md'
  - 'resources/knowledge/test-priorities-matrix.md'
  - 'resources/knowledge/confidence-gate.md'
output:
  - '_bmad-output/test-artifacts/test-design/test-design-epic-5-v2.md'
  - '_bmad-output/implementation-artifacts/5-12-stabilize-pre-existing-vitest-flakes.md'
  - '_bmad-output/implementation-artifacts/5-13-vitest-include-glob-scripts.md'
gateDecision: 'PASS with follow-ups'
newStories: ['5.12', '5.13']
v1ClosuresVerified: ['G1', 'G2', 'G3', 'G4', 'G8']
v1Accepted: ['G5', 'G6', 'G7']
v2NewFindings:
  - id: NG1
    score: 4
    storyId: '5.13'
  - id: NG2
    score: 6
    storyId: '5.12'
---

# Test Design Progress — Epic 5 (v2 Re-Pass)

All five workflow steps complete. Final outputs:

- **TEA v2 artifact** — `_bmad-output/test-artifacts/test-design/test-design-epic-5-v2.md`
- **New story 5.12** (NG2 / score 6) — `_bmad-output/implementation-artifacts/5-12-stabilize-pre-existing-vitest-flakes.md`
- **New story 5.13** (NG1 / score 4) — `_bmad-output/implementation-artifacts/5-13-vitest-include-glob-scripts.md`

**Gate decision:** PASS with follow-ups. Highest v2 risk score is 6 (NG2), below the 9-threshold for gate failure.

**v1 closures verified:** G1 (backup tests in CI), G2 (health DAO tests), G3 (prerender build-output assertion), G4 (trust proxy), G8 (LHCI vs Express runbook). Verified line-by-line against `.github/workflows/quality.yml`, `server/dao/health.dao.test.ts`, `scripts/test-build-output.mjs`, `server/index.ts:54`, and `docs/deployment-runbook.md` §9.

**v1 acceptance unchanged:** G5 (PM2 crash-loop untestable), G6 (font cache headers), G7 (backup concurrent-run guard).

**v2 new findings → new stories:**

- **NG1 (score 4)** → Story 5.13 (Vitest include glob): `scripts/generate-seo-assets.test.mjs` is authored as Vitest but excluded from `vite.config.ts` include glob; 6 tests silently never run.
- **NG2 (score 6)** → Story 5.12 (stabilize pre-existing flakes): chronic flake debt in `server/routes/admin/auth.test.ts` (Story 4.7 timing) and `src/pages/Home*.test.tsx` (RTL waitFor) recurs in every Epic 5 dev record from 5.7 onward.

**Sprint-status / vault / epics.md** updated to reflect the v2 re-pass, story 5.12 and 5.13 entries, and the v2 TEA artifact link.

**Jira sync** — pending; to be triggered via `/jira-assistant` after this run.
