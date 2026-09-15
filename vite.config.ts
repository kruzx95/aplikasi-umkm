import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'KasKedai - Buku Kas Keuangan Kedai UMKM',
        short_name: 'KasKedai',
        description: 'Aplikasi Buku Kas & Keuangan Modern untuk Kedai Makanan & Jajanan UMKM',
        theme_color: '#059669',
        background_color: '#0b0f17',
        display: 'standalone',
        icons: [
          {
            src: '/favicon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}']
      }
    })
  ],
});
