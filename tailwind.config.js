/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#10121B',
        page: '#0B0C13',
        panel: '#181B27',
        panel2: '#1F2230',
        field: '#242739',
        line: 'rgba(238,234,224,0.08)',
        'line-strong': 'rgba(238,234,224,0.14)',
        cream: '#EEEAE0',
        muted: '#94919C',
        'muted-2': '#686670',
        brass: '#C9A15A',
        'brass-dim': '#8A6F35',
        'brass-soft': 'rgba(201,161,90,0.14)',
        green: '#5FB489',
        red: '#E2694F',
      },
      fontFamily: {
        display: ['var(--font-manrope)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
      },
      borderRadius: {
        card: '22px',
      },
    },
  },
  plugins: [],
};
