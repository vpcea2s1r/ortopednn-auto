import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://ortopednn.ru',
  output: 'static',
  adapter: cloudflare({
    platform: 'pages',
    imageService: 'cloudflare'
  }),
  integrations: [
    sitemap(),
    tailwind()
  ]
});