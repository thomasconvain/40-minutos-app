/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Ubuntu', 'sans-serif'],  // Aplica Ubuntu como la fuente principal sans-serif
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

