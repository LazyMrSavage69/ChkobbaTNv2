import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'red-deep': '#8B1A1A',
        'gold': '#C9A84C',
        'green-dark': '#1A4A2E',
        'cream': '#F5ECD7',
        'brown-dark': '#2C1810',
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
      animation: {
        'smoke-rise': 'smokeRise 3s ease-out infinite',
        'smoke-rise-slow': 'smokeRise 5s ease-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        smokeRise: {
          '0%': { opacity: '0.8', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-40px) scale(1.5)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 5px #C9A84C' },
          '50%': { boxShadow: '0 0 20px #C9A84C, 0 0 40px #C9A84C' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
