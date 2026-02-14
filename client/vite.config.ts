import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/auth': 'http://localhost:3000',
      '/post': 'http://localhost:3000',
      '/comment': 'http://localhost:3000',
      '/like': 'http://localhost:3000',
    },
  },
})
