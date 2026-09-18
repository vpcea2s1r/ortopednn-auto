import { defineConfig, fontProviders, svgoOptimizer } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readFileSync, readdirSync } from 'node:fs';

// ponytail: honest lastmod from frontmatter, not "today for all".
const blogDates = new Map();
try {
  for (const f of readdirSync('src/content/blog')) {
    if (!f.endsWith('.md')) continue;
    const m = readFileSync('src/content/blog/' + f, 'utf8').match(/^date:\s*"([^"]+)"/m);
    if (m) blogDates.set(f.slice(0, -3), m[1]);
  }
} catch {}
import compress from '@playform/compress';

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
    '/blog/implantatsiya-zubov-nizhnij-novgorod-cena/': '/blog/implant-ili-protez/',
    '/blog/protezirovanie-zubov-nizhnij-novgorod-ceny/': '/blog/ceny-na-protezirovanie-v-nn/',
    '/blog/nav-schel-mezhdu-koronki/': '/blog/schel-mezhdu-koronkoj-i-zubom/',
    '/blog/snyatie-koronki-cena/': '/blog/posle-ustanovki-koronki/',
    '/blog/bolno-li-stavit-implanty/': '/blog/oslozhneniya-posle-implantatsii/',
    '/blog/piezohirurgiya-v-stomatologii/': '/blog/lazernaya-stomatologiya/',
    '/blog/fiksaciya-koronki-cena/': '/blog/ceny-na-protezirovanie-v-nn/',
    '/checkup/implantatsiya-cena/': '/blog/ceny-na-protezirovanie-v-nn/',
    '/blog/keramicheskie-ili-metallicheskie-brekety-chto-vybrat/': '/blog/cirkonij-ili-metallokeramika/',
    '/checkup/kakoj-protez-vybrat/': '/blog/kakie-semnye-protezy-luchshe/',
    '/services/laboratornaya-vkladka/': '/services/vkladka/',
    '/services/privarka-3-zubov/': '/services/',
    '/blog/elaynery-sovremennyy-sposob-ispravleniya-prikusa/': '/blog/okkluziya-zubov-pravilnoe-smykanie/',
  },
  prefetch: {
    prefetchAll: false,
    hover: true
  },
  integrations: [
    sitemap({
      changefreq: 'weekly',
      serialize(item) {
        const m = item.url.match(/\/blog\/([^/]+)\/?$/);
        const d = m && blogDates.get(m[1]);
        if (d) item.lastmod = d;
        return item;
      },
      filter: (page) => {
        if (page.includes('/preview/')) return false;
        const u = new URL(page);
        const p = u.pathname;
        if (p === '/search/' || p === '/search') return false;
        if (p.startsWith('/blog/og/') || p === '/llms.txt') return false;
        if (/^\/services\/(protezirovanie-zubov|koronki|semnye-protezy|byugelnye-protezy|vradecheskaya-vkladka|korrekciya-semnogo)\/?$/.test(p)) return false;
        if (/^\/blog\/(implantatsiya-zubov-nizhnij-novgorod-cena|protezirovanie-zubov-nizhnij-novgorod-ceny|nav-schel-mezhdu-koronki|snyatie-koronki-cena|bolno-li-stavit-implanty|piezohirurgiya-v-stomatologii|fiksaciya-koronki-cena|keramicheskie-ili-metallicheskie-brekety-chto-vybrat|elaynery-sovremennyy-sposob-ispravleniya-prikusa)\/?$/.test(p)) return false;
        return true;
      }
    }),
    compress({
      HTML: { removeComments: true },
      CSS: true,
      JS: true,
      Image: false,
      SVG: false,
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