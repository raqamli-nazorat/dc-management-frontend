/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: '#0A0A0A',
        charcoal: '#141414',
        graphite: '#1E1E1E',
        smoke: '#2A2A2A',
        ash: '#3D3D3D',
        silver: '#8A8A8A',
        pearl: '#C8C8C8',
        ivory: '#F0F0F0',
        'pure-white': '#FFFFFF',
        cream: '#FAFAFA',
        gold: '#C9A96E',
        'gold-light': '#E8D5B0',
        'gold-dark': '#8B6914',
        success: '#4ADE80',
        warning: '#FBBF24',
        danger: '#F87171',
        info: '#60A5FA',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      boxShadow: {
        luxury: '0 0 0 1px rgba(201,169,110,0.3), 0 4px 24px rgba(0,0,0,0.6)',
        card: '0 2px 16px rgba(0,0,0,0.4)',
        'card-hover': '0 4px 32px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
}
