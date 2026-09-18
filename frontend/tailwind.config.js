/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        soc: '#F59E0B',
        sois: '#38BDF8',
        sod: '#EF4444',
        socse: '#2563EB',
      },
    },
  },
  plugins: [],
}
