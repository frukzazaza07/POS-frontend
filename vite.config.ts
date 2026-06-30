import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5174,
    allowedHosts: ['frivolous-detoxify-magnifier.ngrok-free.dev'],
    proxy: {
      '/api': { target: 'http://172.23.224.1:4000', changeOrigin: true },
      '/auth': { target: 'http://172.23.224.1:4000', changeOrigin: true },
      '/health': { target: 'http://172.23.224.1:4000', changeOrigin: true },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
