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
        polymarket: "#0052FF",
        kalshi: "#00C853",
        profit: "#00E676",
        loss: "#FF1744",
      },
    },
  },
  plugins: [],
};
export default config;
