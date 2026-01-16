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
        heading: ['var(--font-heading)', 'sans-serif'],
        body: ['var(--font-body)', 'serif'],
      },
      colors: {
        bakery: {
          brown: '#2D1B14',
          cream: '#F5F1E8',
          accent: '#D4A574',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
