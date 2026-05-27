/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        code: ['"Fira Code"', 'monospace'],
        sans: ['"Fira Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        neon: '#22C55E',
      },
      boxShadow: {
        'neon-sm': '0 0 8px rgba(34,197,94,0.4)',
        'neon': '0 0 16px rgba(34,197,94,0.5)',
        'neon-lg': '0 0 32px rgba(34,197,94,0.7)',
      },
    },
  },
  plugins: [],
}
