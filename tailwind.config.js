/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0f",
        surface: "#12121a",
        "surface-elevated": "#1a1a25",
        border: "#2a2a3a",
        "text-primary": "#e8e8f0",
        "text-secondary": "#8a8a9a",
        "accent-mushoku": "#7c3aed",
        "accent-rezero": "#dc2626",
        "accent-gold": "#f59e0b",
        "accent-cyan": "#06b6d4",
        danger: "#ef4444",
        success: "#22c55e",
      },
    },
  },
  plugins: [],
}
