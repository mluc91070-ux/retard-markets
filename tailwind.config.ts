import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"Courier Prime"', '"VT323"', 'Courier', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
