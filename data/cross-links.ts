import { categories as serviceCategories } from './services';
import { articles } from './blog-articles';
import type { ServiceItem } from './services';
import type { BlogArticle } from './blog-articles';

export const categoryServices: Record<string, string[]> = {
  koronki: [
    'metallokeramika', 'cirkonievaya-koronka', 'celnolitaya-koronka',
    'celnolitaya-koronka-ni-cr', 'celnolitaya-koronka-na-vkladke',
    'razbornaya-celnolitaya-koronka', 'metallokeramicheskaya-koronka',
    'metallokeramicheskaya-koronka-na-vkladke', 'metalloplastmassovaya-koronka',
    'vremennaya-koronka', 'vremennaya-koronka-lab',
    'esteticheskij-prototip', 'prototype', 'vkladka', 'laboratornaya-vkladka',
    'razbornaya-vkladka', 'byugelnaya-koronka', 'iskusstvennaya-desna',
  ],
  'semnye-protezy': [
    'sjemny-protez', 'polny-sjemny-protez', 'chastichny-sjemny-protez',
    'acryfree', 'nejlonovyj-protez', 'immediat-protez',
    'implakril', 'sjemnyj-protez-implakril', 'immediat-implakril',
    'korrekciya', 'korrekciya-semnogo',
    'perebazirovka-vrachebnaya', 'perebazirovka-laboratornaya', 'perebazirovka-implakril',
    'poychinika-semnogo', 'privarka-1-zuba', 'privarka-2-zubov', 'privarka-3-zubov',
    'armirovanie',
  ],
  'byugelnye-protezy': [
    'byugelnyj', 'byugelnyj-zamki', 'byugelnyj-klammery', 'dentaldi',
    'dopolnitelnyj-zamok', 'kljammer-dopolnitelnyj', 'byugelnaya-koronka',
  ],
  mosty: [
    'metallokeramika', 'cirkonievaya-koronka', 'celnolitaya-koronka',
    'metalloplastmassovaya-koronka', 'metallokeramicheskaya-koronka-na-vkladke',
    'vremennaya-koronka', 'czirkon-titan-mzp',
  ],
  implanty: ['czirkon-titan-mzp', 'metallokeramika', 'cirkonievaya-koronka'],
};

export function getRelatedServices(slug: string, category?: string, maxItems: number = 4): ServiceItem[] {
  const cat = category || articles.find(a => a.slug === slug)?.category;
  if (!cat) return [];
  const slugs = categoryServices[cat];
  if (!slugs) return [];
  const result: ServiceItem[] = [];
  for (const catEntry of serviceCategories) {
    for (const item of catEntry.items) {
      if (slugs.includes(item.slug) && result.length < maxItems) {
        result.push(item);
      }
    }
  }
  return result;
}

export function getArticlesForService(serviceSlug: string, maxItems: number = 4): BlogArticle[] {
  const catsWithService: string[] = [];
  for (const [cat, slugs] of Object.entries(categoryServices)) {
    if (slugs.includes(serviceSlug)) {
      catsWithService.push(cat);
    }
  }
  if (catsWithService.length === 0) return [];
  return articles
    .filter(a => a.category && catsWithService.includes(a.category))
    .slice(0, maxItems);
}
