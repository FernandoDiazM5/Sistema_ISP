import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/Sistema_ISP/',
  plugins: [
    react(),
    tailwindcss(),
    // VitePWA disabled for debugging
  ],

  build: {
    rollupOptions: {
      output: {
        // manualChunks: {
        //   xlsx: ['xlsx'],
        //   vendor: ['react', 'react-dom', 'zustand', 'lucide-react'],
        // },
      },
    },
  },
})
