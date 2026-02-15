import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/Sistema_ISP/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      },
      manifest: {
        name: 'ISP Sistema de Gestión',
        short_name: 'ISP Sistema',
        description: 'Sistema de gestión para proveedores de Internet',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          }
        ]
      }
    })
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
