/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.ejs",
    "./public/**/*.js",
    "./public/**/*.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1e40af",
        secondary: "#3b82f6", 
        accent: "#06b6d4",
        dark: "#1f2937",
        light: "#f8fafc",
      },
    },
  },
  plugins: [],
}
