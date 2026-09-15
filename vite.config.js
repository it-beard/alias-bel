import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages аддае сайт з падкаталога /alias-bel/, таму base адносны.
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx', 'src/**/*.test.{js,jsx}', 'src/test/**'],
    },
  },
})
