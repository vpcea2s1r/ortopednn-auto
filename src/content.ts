import { getCollection } from 'astro:content';

export const allPricing = await getCollection('pricing');
export const allDistricts = await getCollection('districts');

export function getServiceByLink(link: string) {
  for (const cat of allPricing) {
    const item = cat.data.items.find(i => i.link === link);
    if (item) return { ...item, category: cat.data.category };
  }
  return null;
}

export function getAllServicesFlat() {
  return allPricing.flatMap(cat =>
    cat.data.items.map(item => ({ ...item, category: cat.data.category }))
  );
}
