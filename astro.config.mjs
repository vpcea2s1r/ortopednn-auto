import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://ortopednn.ru',
  output: 'static',
  adapter: cloudflare({
    imageService: 'cloudflare',
  }),
  prefetch: {
    prefetchAll: false,
    hover: true
  },
  integrations: [
    sitemap()
  ],
  image: {
    domains: ['ortopednn.ru']
  },
  vite: {
    build: {
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: {
            alpine: ['alpinejs']
          }
        }
      }
    }
  }
});