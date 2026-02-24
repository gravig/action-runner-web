/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "SF Pro Display",
          "Segoe UI Variable",
          "Segoe UI",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      colors: {
        night: "#050914",
        lagoon: "#0ea5e9",
        lime: "#a3e635",
      },
      boxShadow: {
        panel: "0 20px 60px rgba(0, 0, 0, 0.35)",
      },
    },
  },
  plugins: [require("@tailwindcss/container-queries")],
};
