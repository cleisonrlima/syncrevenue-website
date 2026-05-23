# Lighthouse CI Summary — Story 7.7

Date: 2026-05-23
Commands:
- `CHROME_PATH=/home/priscilla/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome npm run lhci`
- `CHROME_PATH=/home/priscilla/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome npm run lhci:mobile`

## Thresholds

| Assertion | Threshold |
|---|---:|
| Performance | >= 0.90 |
| Accessibility | >= 1.00 |
| Best Practices | >= 0.95 |
| SEO | >= 0.90 (desktop warning threshold) |
| LCP | <= 2500 ms |
| CLS | <= 0.10 |
| TBT | <= 200 ms |

## Desktop Results

| Route | Runs | Performance | Accessibility | Best Practices | SEO | Median LCP | Median CLS | Median TBT | Status |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| `/` | 3 | 1.00 | 1.00 | 0.96 | 1.00 | 529 ms | 0.000 | 0 ms | PASS |
| `/privacy` | 3 | 1.00 | 1.00 | 0.96 | 1.00 | 548 ms | 0.000 | 0 ms | PASS |

Warnings:
- `unused-javascript` remains a warning on both desktop routes. This is pre-existing and does not fail the Story 7.7 thresholds.

Uploaded median reports:
- `/`: https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1779557371798-60680.report.html
- `/privacy`: https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1779557372879-99680.report.html

## Mobile Results

| Route | Runs | Performance | Accessibility | Best Practices | SEO | Median LCP | Median CLS | Median TBT | Status |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| `/` | 3 | 0.97 | 1.00 | 0.96 | 1.00 | 2364 ms | 0.000 | 56 ms | PASS |
| `/privacy` | 3 | 0.97 | 1.00 | 0.96 | 1.00 | 2480 ms | 0.000 | 37 ms | PASS |

Uploaded median reports:
- `/`: https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1779557262453-81523.report.html
- `/privacy`: https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1779557263701-45120.report.html

## Rebaseline Decision

No rebaseline needed. All desktop and mobile error assertions passed, and the mobile LCP median remains under the 2500 ms Story 6.13 threshold on both measured routes.
