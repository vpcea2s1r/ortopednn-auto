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
    '/services/vradecheskaya-vkladka/': '/services/vrachebnaya-vkladka/',
    '/services/korrekciya-semnogo/': '/services/korrekciya/',
  },
  prefetch: {
    prefetchAll: false,
    hover: true
  },
  integrations: [
    sitemap({
      filter: (page) => {
        if (page.includes('/preview/')) return false;
        return !page.match(/\/(protezirovanie-zubov|koronki|semnye-protezy|byugelnye-protezy|vradecheskaya-vkladka|korrekciya-semnogo)\/?$/);
      }
    })
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
    subsets: ['cyrillic'],
    weights: [400, 600, 700, 800],
    provider: fontProviders.google()
  }]
});