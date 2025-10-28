import type { Config } from 'tailwindcss'
const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'pivo-dark-blue': '#1E1F21',
        'pivo-text-light': '#E9ECEF',
      },
    },
  },
  plugins: [],
}
export default config