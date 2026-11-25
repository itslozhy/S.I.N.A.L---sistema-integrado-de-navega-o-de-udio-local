import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // caminhos relativos: o site funciona tanto na raiz quanto em
  // itslozhy.github.io/<nome-do-repositório>/ (GitHub Pages)
  base: './',
})
