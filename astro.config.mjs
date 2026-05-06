import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://ortopednn.ru',
  output: 'static',
  adapter: cloudflare({
    imageService: 'cloudflare'
  }),
  prefetch: {
    prefetchAll: false,
    hover: true
  },
  integrations: [
    sitemap(),
    tailwind()
  ],
  image: {
    domains: ['ortopednn.ru']
  }
});