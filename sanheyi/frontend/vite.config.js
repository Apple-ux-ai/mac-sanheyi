import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const AD_API_TARGET = 'https://api-web.kunqiongai.com'
const DEV_PROXY_PREFIX = '/api-web'

export default defineConfig({
  plugins: [react()],
  base: './', // Ensure assets are loaded correctly in Electron
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '#locales': fileURLToPath(new URL('../locales', import.meta.url)),
    },
  },
  server: {
    fs: {
      allow: ['..'],
    },
    proxy: {
      [DEV_PROXY_PREFIX]: {
        target: AD_API_TARGET,
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(new RegExp(`^${DEV_PROXY_PREFIX}`), ''),
      },
    },
  },
})
