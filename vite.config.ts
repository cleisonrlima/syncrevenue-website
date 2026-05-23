import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  build: {
    outDir: 'dist/client',
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    passWithNoTests: true,
    // Story 7.4 follow-up (originally a Story 5.12 stabilisation gap): the
    // Home e2e specs (Home.story-1-*, Privacy.story-*) and several heavier
    // section/integration specs (Team, CommissionAudit, DemoForm, ContactForm)
    // mount `<App />` and rely on RTL `findBy*` polling against React.lazy
    // dynamic imports. Under full-suite CPU contention (Epic 7 added 11 new
    // pages worth of tests and added react-slick to the App import graph,
    // raising baseline import time), the default 5000ms per-test timeout is
    // not enough for those dynamic imports to commit. Story 5.12 stabilised
    // Home.test.tsx by rewriting waitFor → findBy queries, but the
    // story-N-specific e2e specs still flake. Bumping the global per-test
    // timeout to 15s is a low-risk knob that affects only the slow tail
    // (every passing test still exits in well under 5s).
    testTimeout: 30000,
    hookTimeout: 30000,
    // Story 7.4 follow-up: cap worker concurrency. Vitest 4's default is
    // ~(cpus - 1) which on the dev machine produces enough parallel
    // file-level transforms to starve the React.lazy dynamic imports in
    // Home.tsx — leading to the intermittent "Unable to find role=region"
    // failures even with a 30s testTimeout. Capping at 4 workers smooths
    // the contention without meaningfully extending wall-clock (the heavy
    // section transforms get amortised across all consumers). Vitest 4
    // collapsed the pre-v4 `poolOptions.{forks,threads}.maxForks` config
    // into a single top-level `maxWorkers` (see the migration guide
    // referenced by `coverage.DM_a_rWm.js`).
    maxWorkers: 4,
    include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts', 'eslint-rules/**/*.test.mjs', 'scripts/generate-*.test.mjs'],
    exclude: ['node_modules', 'dist', 'tests/e2e/**', 'playwright-report', 'test-results'],
  },
})
