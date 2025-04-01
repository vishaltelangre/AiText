/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,css}",
    "./popup/**/*.{html,js}",
    "./options/**/*.{html,js}",
    "./content.js",
    "./background.js",
    "./**/*.html"  // This ensures all HTML files are scanned
  ],
  prefix: 'ait-',
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        'primary-hover': '#2563eb',
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b'
      }
    }
  },
  plugins: [],
  safelist: [
    {
      pattern: /^ait-/, // This ensures all prefixed classes are included
    }
  ]
}
