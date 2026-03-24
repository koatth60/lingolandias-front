import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-redux': ['@reduxjs/toolkit', 'react-redux'],
          'vendor-socket': ['socket.io-client'],
          'vendor-calendar': ['react-big-calendar'],
          'vendor-charts': ['recharts'],
          'vendor-ui': ['sweetalert2', 'react-toastify', 'emoji-picker-react'],
        },
      },
    },
  },
})
