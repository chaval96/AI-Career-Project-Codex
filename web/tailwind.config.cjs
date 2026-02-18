/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#142031',
        sea: '#0f8a96',
        mint: '#d4ece7',
        sand: '#f5f2e8',
        line: '#c9d5da'
      }
    }
  },
  plugins: []
};
