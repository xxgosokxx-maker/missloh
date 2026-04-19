import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
      },
      colors: {
        ink: {
          50: "#f8f7f5",
          100: "#eeece7",
          200: "#d9d5cc",
          300: "#b5afa1",
          400: "#87806f",
          500: "#5f5849",
          600: "#48433a",
          700: "#34302a",
          800: "#23201c",
          900: "#16140f",
        },
        brand: {
          50: "#fff4f1",
          100: "#ffe5dd",
          200: "#ffcbb9",
          300: "#ffa588",
          400: "#ff7a52",
          500: "#f85a2c",
          600: "#e43f15",
          700: "#bd2f10",
          800: "#962612",
          900: "#7a2114",
        },
        accent: {
          50: "#fefbea",
          100: "#fbf3c3",
          200: "#f8e489",
          300: "#f4cf4b",
          400: "#efbb24",
          500: "#d89c14",
          600: "#bc770f",
          700: "#965510",
          800: "#7b4314",
          900: "#683816",
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgb(22 20 15 / 0.04), 0 8px 24px -8px rgb(22 20 15 / 0.08)",
        lift: "0 4px 12px -2px rgb(22 20 15 / 0.06), 0 18px 40px -12px rgb(22 20 15 / 0.15)",
        glow: "0 10px 30px -10px rgb(248 90 44 / 0.45)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      backgroundImage: {
        "paper":
          "radial-gradient(ellipse at top, rgb(255 244 241 / 0.6), transparent 60%), radial-gradient(ellipse at bottom right, rgb(254 251 234 / 0.6), transparent 55%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
