/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#e6f5f5",
          100: "#ccebeb",
          200: "#99d7d7",
          300: "#66c2c2",
          400: "#33aeae",
          500: "#00999a",
          600: "#007a7b",
          700: "#005c5c",
          800: "#003d3e",
          900: "#001f1f",
        },
      },
    },
  },
  plugins: [],
};
