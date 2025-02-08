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
          DEFAULT: "#8B5CF6", // Violet-500 (brighter than previous)
          dark: "#7C3AED", // Violet-600
          light: "#A78BFA", // Violet-400 (much brighter)
        },
        background: {
          DEFAULT: "#000000",
          light: "#111111",
        },
      },
    },
  },
  plugins: [require("tailwind-scrollbar")],
};
export default config;
