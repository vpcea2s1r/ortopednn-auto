import { defineConfig, fontProviders, svgoOptimizer } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://ortopednn.ru',
  output: 'static',
  redirects: {
    '/services/protezirovanie-zubov/': '/services/',
    '/services/koronki/': '/services/',
    '/services/semnye-protezy/': '/services/',
    '/services/byugelnye-protezy/': '/services/',
  },
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
  experimental: {
    rustCompiler: true,
    svgOptimizer: svgoOptimizer()
  },
  fonts: [{
    name: 'Inter',
    cssVariable: '--font-inter',
    subsets: ['cyrillic', 'latin'],
    weights: [400, 500, 600, 700, 800],
    provider: fontProviders.google()
  }]
});