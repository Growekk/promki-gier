import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base: './' — względne ścieżki, więc build działa pod dowolnym adresem
// (https://<login>.github.io/promki-gier/, Vercel, lokalny plik).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
