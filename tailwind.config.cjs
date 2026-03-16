module.exports = {
  content: ['./index.html', './App.tsx', './index.tsx', './components/**/*.{ts,tsx}', './pages/**/*.{ts,tsx}', './services/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#006994',
        secondary: '#4A90E2',
        background: '#E6F7FF',
        text: '#333333'
      },
      fontFamily: {
        sans: ['Helvetica Neue', 'Microsoft JhengHei', 'Arial', 'sans-serif']
      }
    }
  },
  plugins: []
};