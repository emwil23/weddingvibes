import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Swap these in globals.css via CSS variables
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      colors: {
        cream: "#F7F2ED",
        ivory: "#F7F2ED",
        blush: "#EED6D3",
        "blush-light": "#F6E7E5",
        "dusty-rose": "#D4A5A0",
        "rose-deep": "#B87C77",
        taupe: "#8A7F7C",
        "taupe-light": "#CFC6C3",
        charcoal: "#1A1A1A",
        "charcoal-light": "#3D3D3D",
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "88": "22rem",
        "128": "32rem",
      },
      letterSpacing: {
        "widest-2": "0.25em",
        "widest-3": "0.35em",
      },
      lineHeight: {
        "none-tight": "0.9",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "in-out-quart": "cubic-bezier(0.76, 0, 0.24, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
