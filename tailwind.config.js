/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./popup/**/*.{ts,tsx}",
    "./options/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./*.{ts,tsx}",
  ],
  prefix: "ait-",
  important: true,
  corePlugins: {
    preflight: false, // Base styles are handled in our own way and scoped to .ait-root
  },
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        "primary-hover": "var(--primary-hover)",
      },
    },
  },
  plugins: [],
};
