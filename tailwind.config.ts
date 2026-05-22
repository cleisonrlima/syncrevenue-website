import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

/*
 * Story 7.1 (AC 2): backport of the Figma 'teste' OKLCH design-token set
 * into the Tailwind v3 stack.
 *
 * Two important deltas vs. the pre-7.1 config:
 *
 *   1) All shadcn-aliased colour entries (background, foreground, card,
 *      popover, primary, secondary, muted, accent, destructive, border,
 *      input, ring) now consume CSS custom properties through color-mix()
 *      instead of the previous `hsl(var(--token))` wrapper. The Figma token
 *      set uses bare OKLCH / hex / rgba values (not HSL component strings),
 *      so the old `hsl()` wrapper would produce invalid CSS against the new
 *      palette. color-mix() keeps those raw tokens intact while preserving
 *      Tailwind slash-opacity utilities such as `bg-background/80`.
 *
 *   2) The Epic 6 sober-palette aliases `accent-solid`, `accent-soft`,
 *      `accent-dim` are renamed to `accent-brand`, `accent-brand-soft`,
 *      `accent-brand-dim` to free the `--accent` namespace for the Figma
 *      OKLCH token. All Epic 6 consumers (Buttons, Hero, Comparison,
 *      Security, BenefitsGrid, ContactForm, CommissionAudit, DemoForm,
 *      DemoScheduler, Services, Team, Contact, FormField, FormSelect,
 *      FormTextarea, HeroProductPanel, SectionHeader, Privacy) are migrated
 *      to `--accent-brand*` in the same commit.
 */
const withAlpha = (cssVariable: string) => {
  return (({ opacityValue }: { opacityValue?: string }) => {
    if (opacityValue === undefined) {
      return `var(${cssVariable})`
    }

    return `color-mix(in oklab, var(${cssVariable}) calc(${opacityValue} * 100%), transparent)`
  }) as unknown as string
}

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        brand: {
          'electric-blue': 'var(--color-electric-blue)',
          highlight: 'var(--color-highlight)',
          deep: 'var(--color-deep)',
          navy: 'var(--color-navy)',
          slate: 'var(--color-slate)',
          muted: 'var(--color-muted)',
          offwhite: 'var(--color-offwhite)',
        },
        /* Sober palette (Epic 6 — 2026-05-17, renamed Story 7.1 — 2026-05-22).
         * `accent-solid/-soft/-dim` retired so the Figma OKLCH token can take
         * the canonical `--accent` namespace. */
        'accent-brand': 'var(--accent-brand)',
        'accent-brand-soft': 'var(--accent-brand-soft)',
        'accent-brand-dim': 'var(--accent-brand-dim)',
        'deep-bg': 'var(--deep-bg)',
        ink: 'var(--ink)',
        navy: 'var(--navy)',
        line: 'var(--line)',
        'line-strong': 'var(--line-strong)',
        'slate-token': 'var(--slate-token)',
        'muted-token': 'var(--muted-token)',
        'offwhite-token': 'var(--offwhite)',
        /* shadcn / Figma OKLCH tokens — alpha-aware CSS-variable colors.
         * color-mix() lets OKLCH, hex, and rgba tokens pass through unchanged
         * while keeping Tailwind slash-opacity modifiers functional. */
        border: withAlpha('--border'),
        input: withAlpha('--input'),
        'input-background': withAlpha('--input-background'),
        'switch-background': withAlpha('--switch-background'),
        ring: withAlpha('--ring'),
        background: withAlpha('--background'),
        foreground: withAlpha('--foreground'),
        primary: {
          DEFAULT: withAlpha('--primary'),
          foreground: withAlpha('--primary-foreground'),
        },
        secondary: {
          DEFAULT: withAlpha('--secondary'),
          foreground: withAlpha('--secondary-foreground'),
        },
        destructive: {
          DEFAULT: withAlpha('--destructive'),
          foreground: withAlpha('--destructive-foreground'),
        },
        muted: {
          DEFAULT: withAlpha('--muted'),
          foreground: withAlpha('--muted-foreground'),
        },
        accent: {
          DEFAULT: withAlpha('--accent'),
          foreground: withAlpha('--accent-foreground'),
        },
        popover: {
          DEFAULT: withAlpha('--popover'),
          foreground: withAlpha('--popover-foreground'),
        },
        card: {
          DEFAULT: withAlpha('--card'),
          foreground: withAlpha('--card-foreground'),
        },
        chart: {
          '1': withAlpha('--chart-1'),
          '2': withAlpha('--chart-2'),
          '3': withAlpha('--chart-3'),
          '4': withAlpha('--chart-4'),
          '5': withAlpha('--chart-5'),
        },
        sidebar: {
          DEFAULT: withAlpha('--sidebar'),
          foreground: withAlpha('--sidebar-foreground'),
          primary: withAlpha('--sidebar-primary'),
          'primary-foreground': withAlpha('--sidebar-primary-foreground'),
          accent: withAlpha('--sidebar-accent'),
          'accent-foreground': withAlpha('--sidebar-accent-foreground'),
          border: withAlpha('--sidebar-border'),
          ring: withAlpha('--sidebar-ring'),
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.15s ease-out',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #0055F0 0%, #0075F0 50%, #00A0F0 100%)',
        'gradient-dark-section': 'linear-gradient(180deg, #0D0D3A 0%, #080820 100%)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [tailwindcssAnimate],
}

export default config
