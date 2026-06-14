import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'teacher-icon.svg'],
      manifest: {
        name: 'Oasis College — Teacher Portal',
        short_name: 'OC Teacher',
        description: 'Attendance, timetable & class management for Oasis Private College teachers.',
        start_url: '/teacher/dashboard',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0A1628',
        theme_color: '#7C3AED',
        categories: ['education', 'productivity'],
        icons: [
          {
            src: '/teacher-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/teacher-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
        shortcuts: [
          {
            name: 'Mark Attendance',
            short_name: 'Attendance',
            url: '/teacher/attendance',
            icons: [{ src: '/teacher-icon.svg', sizes: 'any', type: 'image/svg+xml' }],
          },
          {
            name: 'My Timetable',
            short_name: 'Timetable',
            url: '/teacher/timetable',
            icons: [{ src: '/teacher-icon.svg', sizes: 'any', type: 'image/svg+xml' }],
          },
        ],
      },
      workbox: {
        // Precache all build assets (JS, CSS, HTML)
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4 MB — needed for the app bundle
        // Network-first for Firebase API calls — always fresh data when online
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-firestore',
              networkTimeoutSeconds: 10,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/identitytoolkit\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        // Enable PWA in dev mode so you can test install prompt locally
        enabled: true,
      },
    }),
  ],
  css: {
    postcss: {
      plugins: [
        tailwindcss(),
        autoprefixer(),
      ],
    },
  },
})
