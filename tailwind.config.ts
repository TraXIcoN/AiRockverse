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
          DEFAULT: "#9333ea", // Purple 600
          dark: "#7e22ce", // Purple 700
          light: "#a855f7", // Purple 500
        },
        background: {
          DEFAULT: "#000000",
          light: "#111111",
        },
      },
    },
  },
  plugins: [],
};
export default config;
