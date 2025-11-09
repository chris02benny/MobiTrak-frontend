/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#FFC107', // Amber yellow
        background: '#0D0D0D', // Charcoal black
        card: '#1F1F1F', // Dark gray
        textSecondary: '#B0B0B0', // Light gray
        success: '#4CAF50', // Green
        error: '#F44336', // Red
        'primary-hover': '#FFB300',
        'primary-active': '#FFA000',
      },
      backgroundColor: {
        'dark-bg': '#0D0D0D',
        'dark-card': '#1F1F1F',
      },
      textColor: {
        'dark-primary': '#FFFFFF',
        'dark-secondary': '#B0B0B0',
      },
      borderColor: {
        'dark-border': '#1F1F1F',
        'primary-border': '#FFC107',
      },
      boxShadow: {
        'card': '0 4px 10px rgba(255, 193, 7, 0.15)',
        'card-hover': '0 6px 15px rgba(255, 193, 7, 0.25)',
      },
    },
  },
  plugins: [],
}


