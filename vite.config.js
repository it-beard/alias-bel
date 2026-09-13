import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages аддае сайт з падкаталога /alias-bel/, таму base адносны.
export default defineConfig({
  base: './',
  plugins: [react()],
})
