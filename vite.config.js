import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // In local dev, /api/* is served by dev-api.mjs (same code Vercel runs)
    proxy: { '/api': 'http://localhost:8787' },
  },
})
