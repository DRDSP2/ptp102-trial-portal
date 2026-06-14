/* eslint-disable no-undef */
/**
 * Tailwind config — PTP-102.
 *
 * Color palette (introduced in the gunmetal/silver/khaki restyle):
 *   - Semantic shadcn colors are HSL-driven via index.css design tokens.
 *   - The named scales (red/green/yellow/blue/purple/basic) are kept for
 *     backwards compatibility with existing utilities in components, but
 *     each scale has been retuned to a desaturated cousin of the original
 *     so legacy code reads calmly without rewriting every utility:
 *       red    -> muted terracotta (destructive)
 *       green  -> muted olive       (success)
 *       yellow -> muted brass       (warning)
 *       blue   -> muted slate-blue  (info)
 *       purple -> muted lavender    (rare; calmed)
 *       basic  -> gunmetal/silver scale
 */
module.exports = {
  content: [
    './index.html',
    './main.tsx',
    './app/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './context/**/*.{ts,tsx}',
  ],
  darkMode: ['selector'],
  theme: {
    container: {
      center: true,
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: [
          'var(--font-sans)',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          '"Noto Sans"',
          'sans-serif',
        ],
        serif: [
          'var(--font-serif)',
          'ui-serif',
          'Georgia',
          'Cambria',
          '"Times New Roman"',
          'Times',
          'serif',
        ],
        display: [
          'var(--font-serif)',
          'ui-serif',
          'Georgia',
          'serif',
        ],
        mono: [
          'var(--font-mono)',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          '"Liberation Mono"',
          '"Courier New"',
          'monospace',
        ],
      },
      letterSpacing: {
        display: 'var(--tracking-display)',
        eyebrow: 'var(--tracking-eyebrow)',
      },
      colors: {
        /* ---------- Brand tokens (preferred for new code) ------------------ */
        gunmetal: {
          DEFAULT:  'hsl(205 16% 12%)',
          deep:     'hsl(205 16% 9%)',
          elevated: 'hsl(204 14% 16%)',
          hover:    'hsl(205 14% 20%)',
        },
        silver: {
          cool:     'hsl(208 9% 25%)',
          'cool-soft': 'hsl(210 8% 32%)',
          text:     'hsl(210 6% 68%)',
          strong:   'hsl(210 5% 91%)',
        },
        khaki: {
          DEFAULT:  'hsl(74 23% 62%)',
          deep:     'hsl(78 16% 47%)',
          soft:     'hsl(74 25% 75%)',
          tint:     'hsl(74 30% 85%)',
        },
        bone: {
          DEFAULT:  'hsl(40 17% 93%)',
          deep:     'hsl(38 14% 86%)',
        },

        /* ---------- Legacy scales — recalibrated, not removed -------------- */
        /* Original blue (#1683ec) -> muted slate-blue.                       */
        blue: {
          100: '#E5EAF1',
          200: '#C9D2DE',
          300: '#A6B5C7',
          400: '#8295AB',
          500: '#7A8FA6',
          600: '#5E7388',
          700: '#475868',
          800: '#36424F',
          900: '#1F262E',
          DEFAULT: '#7A8FA6',
        },
        /* Original green (#10b780) -> muted olive.                           */
        green: {
          100: '#EAEEDD',
          200: '#D5DEBA',
          300: '#BEC9A8',
          400: '#9AAB7A',
          500: '#7B8F5C',
          600: '#62754A',
          700: '#4D5C3B',
          800: '#3A452D',
          900: '#262E1E',
          DEFAULT: '#7B8F5C',
        },
        /* Original purple — kept usable but desaturated.                     */
        purple: {
          100: '#EBE7EE',
          200: '#D4CCDC',
          300: '#B5A8C2',
          400: '#9587A4',
          500: '#776A87',
          600: '#5E536C',
          700: '#473F52',
          800: '#332D3D',
          900: '#1F1B26',
          DEFAULT: '#776A87',
        },
        /* Original yellow (#d19e00) -> muted brass.                          */
        yellow: {
          100: '#F5EFDF',
          200: '#EBDFBF',
          300: '#E2D2A6',
          400: '#D5BB7E',
          500: '#C9A357',
          600: '#A48643',
          700: '#7F6932',
          800: '#5C4C24',
          900: '#3A3017',
          DEFAULT: '#C9A357',
        },
        /* Original red (#ef4444) -> muted terracotta.                        */
        red: {
          100: '#F4E5E2',
          200: '#E9CCC5',
          300: '#E1B5AC',
          400: '#D49081',
          500: '#C46A5C',
          600: '#A05346',
          700: '#7C4036',
          800: '#592D26',
          900: '#371B17',
          DEFAULT: '#C46A5C',
        },
        /* Basic neutrals — gunmetal scale + cool silvers.                    */
        basic: {
          100: '#F2F0EB',
          200: '#E0DCD0',
          300: '#C8CCD0',
          400: '#A8AEB3',
          500: '#878C92',
          600: '#5C6168',
          700: '#3B4147',
          800: '#22282D',
          900: '#1A1F23',
          1000: '#13171A',
          1100: '#0B0E10',
          DEFAULT: '#878C92',
        },
        stroke: {
          basic: 'hsl(208 9% 25% / 0.45)',
          dark:  'hsl(205 16% 9% / 0.65)',
          light: 'hsl(210 5% 91% / 0.10)',
        },

        /* ---------- shadcn semantic tokens (driven by CSS variables) ------- */
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
          soft: 'hsl(var(--warning-soft))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--gunmetal-deep))',
          soft: 'hsl(var(--success-soft))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--gunmetal-deep))',
          soft: 'hsl(var(--info-soft))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        sm: 'calc(var(--radius) - 6px)',
        DEFAULT: 'calc(var(--radius) - 4px)',
        md: 'calc(var(--radius) - 2px)',
        lg: 'var(--radius)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
        '3xl': 'calc(var(--radius) + 12px)',
      },
      boxShadow: {
        elev: 'var(--ds-shadow-medium)',
        card: 'var(--ds-shadow-border-medium)',
        modal: 'var(--ds-shadow-modal)',
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
        'slide-from-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-to-left': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
      animation: {
        'slide-from-left': 'slide-from-left 0.3s cubic-bezier(0.82, 0.085, 0.395, 0.895)',
        'slide-to-left': 'slide-to-left 0.25s cubic-bezier(0.82, 0.085, 0.395, 0.895)',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
