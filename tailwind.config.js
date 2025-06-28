module.exports = {
    content: [
      './index.html',
      './src/**/*.{js,ts,jsx,tsx}', // Adjust based on your file structure
    ],
    theme: {
      extend: {
        keyframes: {
          fadeIn: {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' },
          },
        },
        animation: {
          fadeIn: 'fadeIn 0.5s ease-in-out',
        },
        colors: {
          slate: require('tailwindcss/colors').slate,
        },
        backgroundColor: ['hover', 'focus'],
    }
      },
    },
    plugins: [],
  };