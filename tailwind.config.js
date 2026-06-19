/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: 'rgb(var(--color-navy) / <alpha-value>)',
          light:   'rgb(var(--color-navy-light) / <alpha-value>)',
          dark:    'rgb(var(--color-navy-dark) / <alpha-value>)',
          800:     'rgb(var(--color-navy-800) / <alpha-value>)',
        },
        gold: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          light:   'rgb(var(--color-primary-light) / <alpha-value>)',
          dark:    'rgb(var(--color-primary-dark) / <alpha-value>)',
          50:      'rgb(var(--color-primary-50) / <alpha-value>)',
          100:     'rgb(var(--color-primary-100) / <alpha-value>)',
        },
        cream: '#F8F9FA',
        slate: {
          DEFAULT: '#4A5568',
          light: '#718096',
          dark: '#2D3748',
        },
      },
      fontFamily: {
        playfair: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
        montserrat: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'count-up': 'countUp 2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
