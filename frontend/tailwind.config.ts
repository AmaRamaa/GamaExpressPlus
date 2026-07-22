import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#B30000",
          "red-dark": "#8C0000",
          "red-light": "#FDEAEA",
        },
        ink: {
          DEFAULT: "#1F2937",
          soft: "#4B5563",
        },
        success: {
          DEFAULT: "#10B981",
          light: "#ECFDF5",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F7F8FA",
          border: "#E5E7EB",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        DEFAULT: "12px",
        lg: "14px",
        xl: "16px",
      },
      boxShadow: {
        soft: "0 2px 8px rgba(31, 41, 55, 0.06)",
        card: "0 4px 16px rgba(31, 41, 55, 0.08)",
        lifted: "0 12px 32px rgba(31, 41, 55, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
