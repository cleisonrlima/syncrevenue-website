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
    include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts', 'eslint-rules/**/*.test.mjs', 'scripts/generate-*.test.mjs'],
    exclude: ['node_modules', 'dist', 'tests/e2e/**', 'playwright-report', 'test-results'],
  },
})
