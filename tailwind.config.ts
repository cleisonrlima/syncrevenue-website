import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

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
        /* Sober palette (Epic 6 — 2026-05-17). Suffixed -token where name collides with shadcn/legacy keys. */
        'accent-solid': 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        'accent-dim': 'var(--accent-dim)',
        'deep-bg': 'var(--deep-bg)',
        ink: 'var(--ink)',
        line: 'var(--line)',
        'line-strong': 'var(--line-strong)',
        'slate-token': 'var(--slate-token)',
        'muted-token': 'var(--muted-token)',
        'offwhite-token': 'var(--offwhite)',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
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
