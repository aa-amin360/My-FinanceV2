/** @type {import('tailwindcss').Config} */

// Shared easing: fast start, gentle settle
const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";

module.exports = {
  darkMode: "class",

  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./frontend/**/*.{js,ts,jsx,tsx}",
    "./shared/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        appBg: "#0B1220",       // main dark background
        cardBg: "#111827",      // card background
        cardSoft: "#1F2937",    // softer card
        borderSoft: "#1f2a3a",
      },

      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        fadeOut: { from: { opacity: "1" }, to: { opacity: "0" } },
        // Page content entering after navigation
        pageIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        // List items appearing (used with a staggered delay)
        rise: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        modalIn: {
          from: { opacity: "0", transform: "scale(0.95) translateY(10px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        modalOut: {
          from: { opacity: "1", transform: "scale(1) translateY(0)" },
          to: { opacity: "0", transform: "scale(0.96) translateY(6px)" },
        },
        // Dropdowns and popovers
        popIn: {
          from: { opacity: "0", transform: "scale(0.97) translateY(-4px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        popOut: {
          from: { opacity: "1", transform: "scale(1) translateY(0)" },
          to: { opacity: "0", transform: "scale(0.97) translateY(-4px)" },
        },
        // Expanded child rows
        slideDown: {
          from: { opacity: "0", transform: "translateY(-6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        // Indeterminate top loading bar
        progress: {
          "0%": { transform: "translateX(-100%) scaleX(0.3)" },
          "50%": { transform: "translateX(0%) scaleX(0.6)" },
          "100%": { transform: "translateX(100%) scaleX(0.3)" },
        },
      },

      animation: {
        fadeIn: `fadeIn 0.3s ${EASE_OUT} both`,
        fadeOut: "fadeOut 0.18s ease-in both",
        pageIn: `pageIn 0.35s ${EASE_OUT} both`,
        rise: `rise 0.4s ${EASE_OUT} both`,
        modalIn: `modalIn 0.25s ${EASE_OUT} both`,
        modalOut: "modalOut 0.18s ease-in both",
        popIn: `popIn 0.18s ${EASE_OUT} both`,
        popOut: "popOut 0.14s ease-in both",
        slideDown: `slideDown 0.25s ${EASE_OUT} both`,
        progress: "progress 1.1s ease-in-out infinite",
      },
    },
  },

  plugins: [],
};
