/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // MindGarden Color Palette
        cream: '#f5f5dc',
        'warm-cream': '#fdf5e6',
        beige: '#f5f5dc',
        'soft-beige': '#ede8dc',
        'warm-beige': '#e8dcc4',
        'olive-green': '#808000',
        'soft-olive': '#9caf88',
        'sage-olive': '#b5a642',
        'mint-green': '#98fb98',
        'soft-mint': '#b6e5d8',
        'light-mint': '#d4f1e8',
        'dark-gray': '#2f2f2f',
        'medium-gray': '#6b6b6b',
        'light-cream': '#fffef7',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-in': 'slideIn 0.5s ease-out',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce': 'bounce 1s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}