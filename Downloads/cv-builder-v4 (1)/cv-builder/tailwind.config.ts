import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: { colors: { ink: "#0f1b2d", paper: "#eef2f6", brand: "#0f766e" } } },
  plugins: [],
} satisfies Config;
