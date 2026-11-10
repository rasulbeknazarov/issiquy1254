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
        basalt: {
          50: "#f7f7f8",
          100: "#eeeef0",
          200: "#d9d9de",
          300: "#b8b8c1",
          400: "#91919f",
          500: "#737384",
          600: "#5d5d6c",
          700: "#4c4c58",
          800: "#41414b",
          900: "#393941",
          950: "#1a1a1f",
        },
        thermal: {
          cold: "#1e3a8a",
          cool: "#3b82f6",
          warm: "#f59e0b",
          hot: "#ef4444",
          extreme: "#dc2626",
        },
        infrared: {
          purple: "#7c3aed",
          blue: "#2563eb",
          green: "#16a34a",
          yellow: "#eab308",
          orange: "#f97316",
          red: "#ef4444",
        },
      },
      backgroundImage: {
        "thermal-gradient":
          "linear-gradient(135deg, #1e3a8a 0%, #7c3aed 25%, #ef4444 50%, #f97316 75%, #eab308 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
