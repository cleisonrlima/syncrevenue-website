/**
 * test-build-output.mjs
 *
 * Post-build smoke test for Vite/prerender output.
 *
 * Runs after `npm run build` (which executes `scripts/prerender.tsx` as the final
 * build step). Validates that the prerender step injected markup for the route
 * allowlist while the lazy Landing home route remains a plain client-rendered
 * shell.
 *
 * Assertions:
 *   1. dist/client/index.html exists and has an empty hydration root.
 *   2. dist/client/privacy/index.html exists.
 *   3. The privacy file contains a prerendered <h1> with "Privacy Policy".
 *   4. The <h1> appears INSIDE the <div id="root"> element.
 *
 * Uses only Node.js built-ins (fs, path, assert). No new dependencies.
 *
 * Run via:    npm run test:build
 * Depends on: A prior `npm run build` (or `npm run build && npm run test:build`).
 *
 * Exit codes:
 *   0 — all assertions pass.
 *   1 — any assertion fails OR the artifact is missing.
 */

import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ── Resolve paths ───────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_CLIENT = path.join(PROJECT_ROOT, 'dist', 'client');
const DIST_INDEX = path.join(DIST_CLIENT, 'index.html');
const DIST_PRIVACY_INDEX = path.join(DIST_CLIENT, 'privacy', 'index.html');

// Expected prerendered heading text (English default locale).
// Source: src/lib/route-registry.ts includes both `/` and `/privacy` in
// PRERENDER_INCLUDED_ROUTES, so scripts/prerender.tsx writes prerendered HTML
// for both routes.
const EXPECTED_HOME_HEADING_TEXT = 'More commission per ticket';
const EXPECTED_PRIVACY_HEADING_TEXT = 'Privacy Policy';

// ── Assertion 1: dist/client/index.html exists ─────────────────────────────

console.log('[test:build] Checking dist/client/index.html exists...');
if (!existsSync(DIST_INDEX)) {
  console.error(`[test:build] ERROR: ${DIST_INDEX} does not exist.`);
  console.error('[test:build] Hint: run `npm run build` before `npm run test:build`.');
  process.exit(1);
}

const html = readFileSync(DIST_INDEX, 'utf8');
console.log(`[test:build]   File size: ${html.length.toLocaleString()} bytes`);

console.log('[test:build] Asserting home shell is prerendered with expected content...');
try {
  assert.ok(
    !/<div id="root"><\/div>/.test(html),
    'dist/client/index.html has an empty <div id="root"></div> — `/` is included in PRERENDER_INCLUDED_ROUTES and should be prerendered. Run `npm run build` to regenerate.'
  );
  assert.ok(
    html.includes(EXPECTED_HOME_HEADING_TEXT),
    `dist/client/index.html does not contain expected home heading "${EXPECTED_HOME_HEADING_TEXT}". ` +
      'The prerender step may not have run, or the hero copy changed without updating this test.'
  );
  console.log('[test:build]   PASS — home shell has prerendered content');
} catch (err) {
  console.error('[test:build] ERROR:', err.message);
  process.exit(1);
}

// ── Assertion 2: dist/client/privacy/index.html exists ─────────────────────

console.log('[test:build] Checking dist/client/privacy/index.html exists...');
if (!existsSync(DIST_PRIVACY_INDEX)) {
  console.error(`[test:build] ERROR: ${DIST_PRIVACY_INDEX} does not exist.`);
  console.error('[test:build] Hint: run `npm run build` before `npm run test:build`.');
  process.exit(1);
}

const privacyHtml = readFileSync(DIST_PRIVACY_INDEX, 'utf8');
console.log(`[test:build]   File size: ${privacyHtml.length.toLocaleString()} bytes`);

// ── Assertion 3: <h1> with prerendered heading text ────────────────────────

console.log('[test:build] Asserting prerendered heading text is present...');
try {
  assert.ok(
    privacyHtml.includes(EXPECTED_PRIVACY_HEADING_TEXT),
    `dist/client/privacy/index.html does not contain expected heading text "${EXPECTED_PRIVACY_HEADING_TEXT}". ` +
      `The prerender step did not run, ran against a stale build, or Privacy.tsx copy changed without updating this test.`
  );
  console.log(`[test:build]   PASS — "${EXPECTED_PRIVACY_HEADING_TEXT}" found`);
} catch (err) {
  console.error('[test:build] ERROR:', err.message);
  process.exit(1);
}

// ── Assertion 4: prerendered markup appears INSIDE <div id="root"> ─────────
//
// The prerender step injects included-route markup inside the root div. If <h1>
// sits outside #root (or #root is empty), the page has not been prerendered and
// the content will only paint after React hydration.

console.log('[test:build] Asserting <h1> appears inside <div id="root">...');
try {
  const rootOpenMatch = privacyHtml.match(/<div\s+id=["']root["'][^>]*>/);
  assert.ok(
    rootOpenMatch && typeof rootOpenMatch.index === 'number',
    'No <div id="root"> opening tag found in dist/client/privacy/index.html — Vite template changed unexpectedly.'
  );

  const rootOpenStart = rootOpenMatch.index;
  const rootOpenEnd = rootOpenStart + rootOpenMatch[0].length;

  // Find the matching </div> for #root. The root contains many nested divs, so
  // we walk the tag stream from rootOpenEnd, tracking <div ...> opens and </div>
  // closes until depth returns to zero.
  let depth = 1;
  const tagRe = /<\/?div\b[^>]*>/g;
  tagRe.lastIndex = rootOpenEnd;
  let rootCloseIndex = -1;
  let tagMatch;
  while ((tagMatch = tagRe.exec(privacyHtml)) !== null) {
    if (tagMatch[0].startsWith('</')) {
      depth -= 1;
      if (depth === 0) {
        rootCloseIndex = tagMatch.index;
        break;
      }
    } else {
      depth += 1;
    }
  }
  assert.ok(
    rootCloseIndex !== -1,
    'Could not find matching </div> for <div id="root"> — HTML is malformed or the root was left unclosed.'
  );

  const rootHtml = privacyHtml.slice(rootOpenEnd, rootCloseIndex);
  const rootedH1 = rootHtml.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/);
  assert.ok(rootedH1, 'No <h1> tag found inside <div id="root">.');
  assert.ok(
    rootedH1[0].includes(EXPECTED_PRIVACY_HEADING_TEXT),
    `The <h1> inside <div id="root"> does not contain expected text "${EXPECTED_PRIVACY_HEADING_TEXT}". ` +
      `This means the expected copy may only appear elsewhere in the document, not in the prerendered heading.`
  );

  const rootedH1Index = rootOpenEnd + (rootedH1.index ?? rootHtml.indexOf(rootedH1[0]));
  assert.ok(
    rootedH1Index > rootOpenEnd && rootedH1Index < rootCloseIndex,
    `<h1> at byte offset ${rootedH1Index} is NOT inside <div id="root"> (root span: ${rootOpenStart}..${rootCloseIndex}). ` +
      `This breaks the prerender invariant: included-route content must be inside the hydration root BEFORE hydration runs. ` +
      `Verify scripts/prerender.tsx ran and successfully injected markup into <div id="root"></div> (it bails out with a warning if the placeholder pattern does not match).`
  );

  console.log(
    `[test:build]   PASS — <h1> at offset ${rootedH1Index} is inside #root (${rootOpenStart}..${rootCloseIndex})`
  );
} catch (err) {
  console.error('[test:build] ERROR:', err.message);
  process.exit(1);
}

console.log('\n[test:build] All build-output assertions passed.');
process.exit(0);
