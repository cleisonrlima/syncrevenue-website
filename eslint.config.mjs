import tseslint from 'typescript-eslint'
import tsParser from '@typescript-eslint/parser'
import tRequiresDefaultValue from './eslint-rules/t-requires-default-value.mjs'

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'playwright-report/**',
      'data/**',
      'src/lib/brand-tokens.contrast.manifest.ts',
      'eslint-rules/__tests__/**',
      'coverage/**',
    ],
  },
  {
    files: ['src/**/*.{ts,tsx}', 'server/**/*.ts'],
    ignores: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      local: {
        rules: {
          't-requires-default-value': tRequiresDefaultValue,
        },
      },
    },
    rules: {
      'local/t-requires-default-value': 'error',
    },
  },
]
