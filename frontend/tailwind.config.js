// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#22d3ee',
      },
      
      backgroundImage: {
        glass: 'linear-gradient(to right, rgba(255,255,255,0.03), rgba(255,255,255,0.02))',
      },
      dropShadow: {
        glow: '0 0 8px rgba(255,255,255,0.4), 0 0 15px rgba(255,255,255,0.1)',
      },
      fontFamily: {
  sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
},
animation: {
    'ping-slow': 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
    'ping-slower': 'ping 4.5s cubic-bezier(0, 0, 0.2, 1) infinite',
  },
      animation: {
        slide: 'slide 2s ease-in-out infinite',
        glow: 'glow 2.5s ease-in-out infinite alternate',
        'glow-pulse': 'glowPulse 6s ease-in-out infinite',
      },
      keyframes: {
        slide: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0%)' },
        },
        glow: {
          '0%': { opacity: 0.5 },
          '100%': { opacity: 1 },
        },
        glowPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: 0.3 },
          '50%': { transform: 'scale(1.15)', opacity: 0.6 },
        },
      },
    },
  },
  plugins: [],
}
