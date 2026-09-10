import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F7F5',
        surface: '#FFFFFF',
        hairline: '#E5E5E3',
        'hairline-soft': '#EFEFED',
        ink: '#111111',
        'ink-soft': '#3A3A3A',
        graphite: '#6B6B6B',
        stone: '#9B9B9B',
        ash: '#C4C4C2',
        accent: '#F5A623',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
