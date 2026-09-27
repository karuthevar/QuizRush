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
        rush: {
          red: "#E21B3C",
          "red-dark": "#b0132c",
          blue: "#1368CE",
          "blue-dark": "#0c4fa3",
          yellow: "#FFA602",
          "yellow-dark": "#d48500",
          green: "#26890C",
          "green-dark": "#1d6c09",
          purple: "#46178F",
          "purple-dark": "#310e69",
          "purple-light": "#864cbf",
          navy: "#131032",
          dark: "#0b081d",
          gray: "#f2f2f2",
        },
      },
      animation: {
        "bounce-slight": "bounceSlight 1s infinite",
        "pulse-fast": "pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 3s ease-in-out infinite",
      },
      keyframes: {
        bounceSlight: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
