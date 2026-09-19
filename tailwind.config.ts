import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['var(--font-heading)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      colors: {
        paper: '#FAF8F5',
        ink: '#1F1D1B',
        sand: '#F2ECE3',
        line: '#EAE4DC',
        clay: '#7A4031',
        muted: '#665F58',
      },
    },
  },
  plugins: [],
} satisfies Config;
