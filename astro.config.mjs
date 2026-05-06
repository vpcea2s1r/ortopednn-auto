import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://ortopednn.ru',
  output: 'server',
  adapter: cloudflare({
    imageService: 'cloudflare'
  }),
  integrations: [
    sitemap(),
    tailwind()
  ]
});