/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // 👈 IMPORTANT

  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        appBg: "#0B1220",       // main dark background
        cardBg: "#111827",      // card background
        cardSoft: "#1F2937",    // softer card
        borderSoft: "#1f2a3a",
      }
    }
  },

  plugins: [],
};
