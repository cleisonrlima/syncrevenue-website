/**
 * test-build-output.mjs
 *
 * Post-build smoke test for dist/client/index.html.
 *
 * Runs after `npm run build` (which executes `scripts/prerender.tsx` as the final
 * build step). Validates that the prerender step actually injected the hero
 * markup into the production HTML artifact, so a broken prerender pipeline
 * cannot ship to production undetected.
 *
 * Assertions:
 *   1. dist/client/index.html exists.
 *   2. The file contains an <h1 ...> tag with the prerendered hero heading text.
 *   3. The file contains a <picture> element (hero background image).
 *   4. The <h1> tag appears INSIDE the <div id="root"> element — this is the
 *      load-bearing invariant. The prerender step (Story 5.6) injects markup
 *      INTO the root div; without that injection the root would be empty and
 *      the hero would not paint until React hydration finished, regressing
 *      mobile LCP from ~2.3s to ~3.0s+.
 *
 *      Note: Vite places the entry <script type="module"> in <head>, which is
 *      implicitly deferred — it does not block paint. The position of the
 *      script relative to <h1> is therefore not a useful invariant; the real
 *      invariant is "is the <h1> already in the prerendered DOM before
 *      hydration runs", which is equivalent to "is <h1> inside #root".
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
const DIST_INDEX = path.join(PROJECT_ROOT, 'dist', 'client', 'index.html');

// Expected prerendered hero heading text (English default locale).
// Source: scripts/prerender.tsx renders the EN translation of Hero.tsx, which
// produces an <h1> beginning with "More commission per ticket".
const EXPECTED_HEADING_TEXT = 'More commission per ticket';

// ── Assertion 1: dist/client/index.html exists ─────────────────────────────

console.log('[test:build] Checking dist/client/index.html exists...');
if (!existsSync(DIST_INDEX)) {
  console.error(`[test:build] ERROR: ${DIST_INDEX} does not exist.`);
  console.error('[test:build] Hint: run `npm run build` before `npm run test:build`.');
  process.exit(1);
}

const html = readFileSync(DIST_INDEX, 'utf8');
console.log(`[test:build]   File size: ${html.length.toLocaleString()} bytes`);

// ── Assertion 2: <h1> with prerendered heading text ────────────────────────

console.log('[test:build] Asserting prerendered <h1> heading is present...');
try {
  assert.ok(
    /<h1[\s>]/.test(html),
    `dist/client/index.html does not contain any <h1> tag — prerender step likely failed.`
  );
  assert.ok(
    html.includes(EXPECTED_HEADING_TEXT),
    `dist/client/index.html does not contain expected hero heading text "${EXPECTED_HEADING_TEXT}". ` +
      `The prerender step did not run, ran against a stale build, or Hero.tsx copy changed without updating this test.`
  );
  console.log(`[test:build]   PASS — <h1> with "${EXPECTED_HEADING_TEXT}" found`);
} catch (err) {
  console.error('[test:build] ERROR:', err.message);
  process.exit(1);
}

// ── Assertion 3: <picture> element present ─────────────────────────────────

console.log('[test:build] Asserting <picture> element is present...');
try {
  assert.ok(
    /<picture[\s>]/.test(html),
    `dist/client/index.html does not contain a <picture> element — hero background image markup is missing.`
  );
  console.log('[test:build]   PASS — <picture> found');
} catch (err) {
  console.error('[test:build] ERROR:', err.message);
  process.exit(1);
}

// ── Assertion 4: <h1> appears INSIDE <div id="root"> ───────────────────────
//
// This is the LCP-critical invariant. The prerender step injects the hero markup
// inside the root div. If <h1> sits outside #root (or #root is empty), the page
// has not been prerendered and the hero will only paint after React hydration —
// which on slow networks regresses mobile LCP from ~2.3s to ~3.0s+.
//
// Vite places the entry <script type="module"> in <head>; module scripts are
// implicitly deferred and do not block paint, so script vs <h1> ordering is not
// a meaningful invariant. What matters is: is the heading present in the
// pre-hydration DOM, AND is it inside the hydration root container.

console.log('[test:build] Asserting <h1> appears inside <div id="root">...');
try {
  const rootOpenMatch = html.match(/<div\s+id=["']root["'][^>]*>/);
  assert.ok(
    rootOpenMatch && typeof rootOpenMatch.index === 'number',
    'No <div id="root"> opening tag found in dist/client/index.html — Vite template changed unexpectedly.'
  );

  const rootOpenStart = rootOpenMatch.index;
  const rootOpenEnd = rootOpenStart + rootOpenMatch[0].length;

  // Find the matching </div> for #root. The root contains many nested divs, so
  // we walk the tag stream from rootOpenEnd, tracking <div ...> opens and </div>
  // closes until depth returns to zero.
  let depth = 1;
  let cursor = rootOpenEnd;
  const tagRe = /<\/?div\b[^>]*>/g;
  tagRe.lastIndex = cursor;
  let rootCloseIndex = -1;
  let tagMatch;
  while ((tagMatch = tagRe.exec(html)) !== null) {
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

  const h1Index = html.search(/<h1[\s>]/);
  assert.notEqual(h1Index, -1, 'No <h1> tag found in dist/client/index.html.');

  assert.ok(
    h1Index > rootOpenEnd && h1Index < rootCloseIndex,
    `<h1> at byte offset ${h1Index} is NOT inside <div id="root"> (root span: ${rootOpenStart}..${rootCloseIndex}). ` +
      `This breaks the LCP-critical prerender invariant: hero content must be inside the hydration root BEFORE hydration runs. ` +
      `Verify scripts/prerender.tsx ran and successfully injected markup into <div id="root"></div> (it bails out with a warning if the placeholder pattern does not match).`
  );

  console.log(
    `[test:build]   PASS — <h1> at offset ${h1Index} is inside #root (${rootOpenStart}..${rootCloseIndex})`
  );
} catch (err) {
  console.error('[test:build] ERROR:', err.message);
  process.exit(1);
}

console.log('\n[test:build] All build-output assertions passed.');
process.exit(0);
