/** @type {import('tailwindcss').Config} */

// Helper: colours backed by RGB-triplet CSS variables so Tailwind's
// opacity modifiers (e.g. bg-accent/10) keep working.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Semantic design tokens (see src/index.css) ──────────────
        app: v('bg-app'),
        sidebar: v('bg-sidebar'),
        panel: v('bg-surface'),
        raised: v('bg-surface-elevated'),
        hover: v('bg-hover'),
        inset: v('bg-inset'),
        fg: {
          DEFAULT: v('text-primary'),
          secondary: v('text-secondary'),
          muted: v('text-muted'),
        },
        line: {
          DEFAULT: 'var(--border-default)',
          strong: 'var(--border-strong)',
        },
        accent: {
          DEFAULT: v('accent-primary'),
          hover: v('accent-primary-hover'),
          solid: v('accent-solid'),
          text: v('accent-text'),
          on: v('on-accent'),
          secondary: v('accent-secondary'),
          highlight: v('accent-highlight'),
        },
        success: { DEFAULT: v('success'), text: v('success-text') },
        warning: { DEFAULT: v('warning'), text: v('warning-text') },
        danger: { DEFAULT: v('danger'), text: v('danger-text') },
        info: { DEFAULT: v('info'), text: v('info-text') },

        // Brand scale (teal). Kept under the `primary` name so any
        // remaining primary-* utility renders in the new identity.
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },

        // Legacy numeric surface scale, remapped onto the new tokens so
        // nothing that still references it falls back to the old palette.
        surface: {
          50: v('surface-50'),
          100: v('surface-100'),
          200: v('surface-200'),
          300: v('surface-300'),
          400: v('surface-400'),
          500: v('surface-500'),
          600: v('surface-600'),
          700: v('surface-700'),
          800: v('surface-800'),
          900: v('surface-900'),
          950: v('surface-950'),
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '14px' }],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        focus: '0 0 0 3px rgb(var(--accent-primary) / 0.35)',
      },
      transitionDuration: {
        DEFAULT: '180ms',
      },
      animation: {
        'fade-in': 'fadeIn 180ms ease-out',
        'slide-up': 'slideUp 200ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'slide-right': 'slideRight 200ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'slide-left': 'slideLeft 200ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'pop-in': 'popIn 160ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: { '0%': { transform: 'translateY(8px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
        slideRight: { '0%': { transform: 'translateX(12px)', opacity: 0 }, '100%': { transform: 'translateX(0)', opacity: 1 } },
        slideLeft: { '0%': { transform: 'translateX(-12px)', opacity: 0 }, '100%': { transform: 'translateX(0)', opacity: 1 } },
        popIn: { '0%': { transform: 'scale(0.97)', opacity: 0 }, '100%': { transform: 'scale(1)', opacity: 1 } },
      },
    },
  },
  plugins: [],
};
