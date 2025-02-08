import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#8B5CF6", // Violet-500
          dark: "#7C3AED", // Violet-600
          light: "#A78BFA", // Violet-400
        },
        background: {
          DEFAULT: "#000000",
          light: "#111111",
        },
      },
      keyframes: {
        "slide-lr": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        wag: {
          "0%, 100%": { transform: "rotate(-10deg)" },
          "50%": { transform: "rotate(10deg)" },
        },
      },
      animation: {
        "slide-lr": "slide-lr 3s linear infinite",
        wag: "wag 1s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwind-scrollbar")],
};
export default config;
