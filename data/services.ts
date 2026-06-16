export interface ServiceItem {
  slug: string;
  title: string;
  desc: string;
}

export interface ServiceCategory {
  name: string;
  items: ServiceItem[];
}

export const categories: ServiceCategory[] = [
  {
    name: 'Коронки и бюгельные',
    items: [
      { slug: 'metallokeramika', title: 'Металлокерамическая коронка', desc: 'Коронки с металлическим каркасом и керамическим покрытием.' },
      { slug: 'cirkonievaya-koronka', title: 'Безметалловая коронка (цирконий)', desc: 'Эстетичные коронки из диоксида циркония.' },
      { slug: 'celnolitaya-koronka', title: 'Цельнолитая коронка (кобальт)', desc: 'Прочные металлические коронки из кобальт-хрома.' },
      { slug: 'celnolitaya-koronka-ni-cr', title: 'Цельнолитая коронка (никель-хром)', desc: 'Доступный вариант из никель-хрома для жевательных зубов.' },
      { slug: 'celnolitaya-koronka-na-vkladke', title: 'Цельнолитая коронка на вкладке', desc: 'Монолитная металлическая конструкция для сильно разрушенных зубов.' },
      { slug: 'razbornaya-celnolitaya-koronka', title: 'Разборная цельнолитая коронка на вкладке', desc: 'Для сложных случаев с расходящимися корнями.' },
      { slug: 'metallokeramicheskaya-koronka-na-vkladke', title: 'Металлокерамика на вкладке', desc: 'Эстетичная коронка на прочном металлическом основании.' },
      { slug: 'metalloplastmassovaya-koronka', title: 'Металлопластмассовая коронка', desc: 'Бюджетный вариант с металлическим каркасом.' },
      { slug: 'byugelnaya-koronka', title: 'Цельнолитая бюгельная коронка', desc: 'Для крепления бюгельного протеза.' },
      { slug: 'byugelnyj-klammery', title: 'Бюгельный протез на кламмерах', desc: 'Протез на кламмерах ДенталДи — прочное и комфортное решение.' },
      { slug: 'iskusstvennaya-desna', title: 'Металлокерамическая искусственная десна', desc: 'Керамическая имитация десны для эстетики при рецессии.' },
      { slug: 'vremennaya-koronka', title: 'Временная коронка', desc: 'Защита обточенного зуба на время изготовления конструкции.' },
      { slug: 'czirkon-titan-mzp', title: 'МЗП одной коронки (цирконий, титан)', desc: 'Металлокерамическая коронка на имплантат.' },
      { slug: 'byugelnyj', title: 'Бюгельные протезы', desc: 'На замках и кламмерах. Удобные и эстетичные съёмные конструкции.' },
      { slug: 'byugelnyj-zamki', title: 'Бюгельные протезы на замках', desc: 'Замковая фиксация МК-1. Высокая эстетика и комфорт.' },
      { slug: 'dentaldi', title: 'Бюгель ДенталДи', desc: 'Гибкий бюгельный протез с белым каркасом без металла.' },
    ]
  },
  {
    name: 'Съёмные протезы',
    items: [
      { slug: 'sjemny-protez', title: 'Съёмные протезы', desc: 'Акриловые, AcryFree, нейлоновые. Полное или частичное протезирование.' },
      { slug: 'polny-sjemny-protez', title: 'Полный съёмный протез', desc: 'Протезирование верхней или нижней челюсти при отсутствии всех зубов.' },
      { slug: 'chastichny-sjemny-protez', title: 'Частичный съёмный протез термопластический', desc: 'Гибкий частичный протез из термопластичного материала.' },
      { slug: 'acryfree', title: 'Протез AcryFree', desc: 'Гибкий термопластичный протез без мономеров. Комфорт и эстетика.' },
      { slug: 'nejlonovyj-protez', title: 'Нейлоновый съёмный протез', desc: 'Мягкий гибкий протез. Гипоаллергенный материал.' },
      { slug: 'immediat-protez', title: 'Иммедиат-протез', desc: 'Временный протез сразу после удаления зубов.' },
      { slug: 'immediat-implakril', title: 'Иммедиат-протез из Имплакрила', desc: 'Временный протез из материала Имплакрил сразу после удаления.' },
      { slug: 'sjemnyj-protez-implakril', title: 'Съёмный протез из Имплакрила', desc: 'Гипоаллергенный термопластичный протез из Имплакрила.' },
    ]
  },
  {
    name: 'Зубные вкладки',
    items: [
      { slug: 'vrachebnaya-vkladka', title: 'Врачебная вкладка', desc: 'Пломбировочная вкладка, изготовленная врачом за один визит.' },
      { slug: 'vkladka', title: 'Зубная вкладка', desc: 'Микропротез для восстановления сильно разрушенных зубов.' },
    ]
  },
  {
    name: 'Информация',
    items: [
      { slug: 'condition', title: 'Показания к протезированию', desc: 'Когда необходимо протезирование: показания и рекомендации.' },
      { slug: 'variant', title: 'Варианты протезирования', desc: 'Сравнение съёмных и несъёмных конструкций.' },
    ]
  }
];

export function getSlugFromPath(pathname: string): string {
  return pathname.replace(/\/$/, '').split('/').pop() || '';
}

export function getRelatedServices(currentSlug: string, maxItems = 6): ServiceItem[] {
  for (const cat of categories) {
    const idx = cat.items.findIndex(i => i.slug === currentSlug);
    if (idx !== -1) {
      const others = cat.items.filter(i => i.slug !== currentSlug);
      const shuffled = others.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, maxItems);
    }
  }
  return [];
}

export function getProcedureType(slug: string): string {
  const diagnosticSlugs = ['otlisk-', 'diagnosticheskaya', 'model-3d', 'modelirovanie', 'prikusnoj', 'lozhka'];
  const surgicalSlugs = ['snatie-'];
  if (diagnosticSlugs.some(s => slug.startsWith(s))) return 'DiagnosticProcedure';
  if (surgicalSlugs.some(s => slug.startsWith(s))) return 'SurgicalProcedure';
  return 'TherapeuticProcedure';
}
