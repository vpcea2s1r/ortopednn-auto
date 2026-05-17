import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://ortopednn.ru',
  output: 'static',
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
      cssCodeSplit: true
    }
  },
  fonts: [{
    name: 'Inter',
    cssVariable: '--font-inter',
    subsets: ['cyrillic', 'latin'],
    weights: [400, 500, 600, 700, 800],
    provider: fontProviders.google()
  }]
});