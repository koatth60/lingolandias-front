/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--ll-${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
        gothic: ['"Pirata One"', 'Georgia', 'serif'],
      },
      colors: {
        // Neutrals tinted toward the logo's violet instead of Tailwind's cool grey.
        gray: {
          50: '#FAF9FC',
          100: '#F4F2F8',
          200: '#E8E6EF',
          300: '#D9D6E3',
          400: '#A29EB0',
          500: '#726E82',
          600: '#4E4A5C',
          700: '#3A3647',
          800: '#221F2B',
          900: '#17141F',
          950: '#0E0D13',
        },
        ll: {
          canvas: token('canvas'),
          panel: token('panel'),
          sidebar: token('sidebar'),
          subtle: token('subtle'),
          hover: token('hover'),
          line: token('line'),
          line2: token('line-2'),
          ink: token('ink'),
          ink2: token('ink-2'),
          ink3: token('ink-3'),
          ink4: token('ink-4'),
          violet: token('violet'),
          'violet-hover': token('violet-hover'),
          'violet-ink': token('violet-ink'),
          'violet-tint': token('violet-tint'),
          'violet-line': token('violet-line'),
          'on-violet': token('on-violet'),
          gold: token('gold'),
          'gold-ink': token('gold-ink'),
          'gold-tint': token('gold-tint'),
          teal: token('teal'),
          'teal-ink': token('teal-ink'),
          'teal-tint': token('teal-tint'),
          ember: token('ember'),
          danger: token('danger'),
        },
        // Legacy names kept so untouched screens pick up the new palette.
        'brand-dark': token('panel'),
        'brand-dark-secondary': token('canvas'),
        'brand-purple': token('violet'),
        'brand-orange': token('gold'),
        'brand-teal': token('teal'),
        'brand-light': token('canvas'),
        'brand-navbar-light': token('violet'),
      },
      boxShadow: {
        'll-1': '0 1px 2px rgb(var(--ll-shadow) / 0.06)',
        'll-2': '0 1px 2px rgb(var(--ll-shadow) / 0.05), 0 8px 24px -12px rgb(var(--ll-shadow) / 0.22)',
        'll-pop': '0 1px 2px rgb(var(--ll-shadow) / 0.08), 0 20px 48px -16px rgb(var(--ll-shadow) / 0.35)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        }
      }
    }
  },
  plugins: [],
}
