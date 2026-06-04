import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        parchment: "#fbf4df",
        tide: "#1f8a9e",
        coral: "#e45f4f",
        gold: "#f3b33d",
        leaf: "#4f9d69",
        night: "#24324a"
      },
      boxShadow: {
        game: "0 18px 45px rgba(23, 32, 51, 0.18)",
        insetGame: "inset 0 -4px 0 rgba(23, 32, 51, 0.14)"
      }
    }
  },
  plugins: []
};

export default config;
