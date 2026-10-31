import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Caminhos relativos para funcionar no GitHub Pages (/<repositorio>/)
  base: './',
  plugins: [react()],
})
