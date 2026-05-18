/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        claude: {
          bg: '#F5F1EB',
          sidebar: '#E8E3D6',
          accent: '#8B7355',
          text: '#2D2D2D',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

