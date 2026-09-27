import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Percorsi relativi: sotto Ingress l'app è servita da /api/hassio_ingress/<token>/,
  // con percorsi assoluti (/assets/...) la pagina resterebbe bianca.
  base: './',
  build: {
    outDir: 'dist'
  }
})
