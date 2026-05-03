import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/cwa-api': {
        target: 'https://opendata.cwa.gov.tw',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cwa-api/, '/api/v1/rest/datastore'),
      },
    },
  },
})

