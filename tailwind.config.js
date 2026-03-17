/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1A5276',
          mid: '#2E86C1',
          light: '#D6EAF8',
        },
        accent: '#E67E22',
        success: '#1E8449',
        warning: '#F39C12',
        danger: '#C0392B',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
