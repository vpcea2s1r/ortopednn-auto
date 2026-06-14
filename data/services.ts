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
      { slug: 'vremennaya-koronka-lab', title: 'Временная коронка лабораторная', desc: 'Более прочная временная коронка из лаборатории.' },
      { slug: 'esteticheskij-prototip', title: 'Эстетический прототип', desc: 'Визуализация будущих зубов из воска или пластмассы.' },
      { slug: 'prototype', title: 'Прототип зубов', desc: 'Примерка улыбки до начала лечения. Восковая моделировка.' },
      { slug: 'czirkon-titan-mzp', title: 'МЗП одной коронки (цирконий, титан)', desc: 'Металлокерамическая коронка на имплантат.' },
      { slug: 'byugelnyj', title: 'Бюгельные протезы', desc: 'На замках и кламмерах. Удобные и эстетичные съёмные конструкции.' },
      { slug: 'byugelnyj-zamki', title: 'Бюгельные протезы на замках', desc: 'Замковая фиксация МК-1. Высокая эстетика и комфорт.' },
      { slug: 'dopolnitelnyj-zamok', title: 'Дополнительный замок', desc: 'Дополнительный замок для улучшения фиксации.' },
      { slug: 'kljammer-dopolnitelnyj', title: 'Кламмер дополнительный', desc: 'Дополнительный кламмер для бюгельного протеза.' },
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
    ]
  },
  {
    name: 'Зубные вкладки',
    items: [
      { slug: 'vrachebnaya-vkladka', title: 'Врачебная вкладка', desc: 'Пломбировочная вкладка, изготовленная врачом за один визит.' },
      { slug: 'vkladka', title: 'Зубная вкладка', desc: 'Микропротез для восстановления сильно разрушенных зубов.' },
      { slug: 'laboratornaya-vkladka', title: 'Лабораторная вкладка', desc: 'Керамическая или композитная вкладка из лаборатории.' },
      { slug: 'razbornaya-vkladka', title: 'Разборная лабораторная вкладка', desc: 'Для зубов с искривлёнными каналами.' },
    ]
  },
  {
    name: 'Диагностика и слепки',
    items: [
      { slug: 'otlisk-alginatnyj', title: 'Снятие альгинатных оттисков', desc: 'Оттиск альгинатной массой для диагностики.' },
      { slug: 'otlisk-speedex', title: 'Снятие двухслойных оттисков Speedex', desc: 'Точный двухслойный оттиск.' },
      { slug: 'otlisk-elite', title: 'Снятие двухслойных оттисков Elite', desc: 'Двухслойный оттиск с высокой детализацией.' },
      { slug: 'otlisk-impregum', title: 'Снятие двухслойных оттисков Impregum', desc: 'Полиэфирный оттиск для максимальной точности.' },
      { slug: 'silikonovyj-klyuch', title: 'Силиконовый ключ', desc: 'Силиконовый ключ для переноса модели в полость рта.' },
      { slug: 'diagnosticheskaya-model', title: 'Диагностические модели (2 челюсти)', desc: 'Гипсовые модели обеих челюстей.' },
      { slug: 'model-3d-print', title: 'Модель неразборная 3D-print', desc: '3D-печать модели одной челюсти.' },
      { slug: 'modelirovanie-voskom', title: 'Диагностическое моделирование воском', desc: 'Восковое моделирование для планирования.' },
      { slug: 'prikusnoj-shablon', title: 'Прикусной шаблон', desc: 'Регистрация прикуса стандартным шаблоном.' },
      { slug: 'prikusnoj-shablon-bazis', title: 'Прикусной шаблон на жестком базисе', desc: 'Прикусной шаблон на индивидуальном базисе.' },
      { slug: 'lozhka-individualnaya', title: 'Ложка индивидуальная', desc: 'Индивидуальная оттискная ложка по модели.' },
    ]
  },
  {
    name: 'Фиксация и ремонт',
    items: [
      { slug: 'fiksaciya-fuji', title: 'Фиксация коронки Fuji', desc: 'Постоянная фиксация на стеклоиономерный цемент.' },
      { slug: 'fiksaciya-temp-bond', title: 'Временная фиксация коронки Temp-Bond', desc: 'Временная фиксация на непостоянный цемент.' },
      { slug: 'fiksaciya-maxcem', title: 'Фиксация коронки Maxcem', desc: 'Фиксация на композитный цемент Maxcem.' },
      { slug: 'snatie-shtampovannyh', title: 'Снятие штампованных коронок', desc: 'Удаление старых штампованных коронок.' },
      { slug: 'snatie-celnolicyh', title: 'Снятие цельнолитых коронок', desc: 'Удаление цельнолитых коронок.' },
      { slug: 'korrekciya', title: 'Ремонт и коррекция протезов', desc: 'Исправление натирания, перебазировка, починка.' },
      { slug: 'perebazirovka-vrachebnaya', title: 'Перебазировка врачебная', desc: 'Коррекция базиса протеза прямо в клинике.' },
      { slug: 'perebazirovka-laboratornaya', title: 'Перебазировка лабораторная', desc: 'Полная перебазировка в лаборатории.' },
      { slug: 'perebazirovka-implakril', title: 'Перебазировка из Имплакрила', desc: 'Перебазировка современным материалом Имплакрил.' },
      { slug: 'poychinika-semnogo', title: 'Починка перелома съемного протеза', desc: 'Ремонт трещин и переломов протеза.' },
      { slug: 'privarka-1-zuba', title: 'Приварка одного зуба', desc: 'Добавление одного зуба к съемному протезу.' },
      { slug: 'privarka-2-zubov', title: 'Приварка двух зубов', desc: 'Добавление двух зубов к съемному протезу.' },
      { slug: 'privarka-3-zubov', title: 'Приварка трех зубов', desc: 'Добавление трех зубов к съемному протезу.' },
      { slug: 'armirovanie', title: 'Армирование протеза', desc: 'Усиление протеза металлической сеткой или волокном.' },
    ]
  },
  {
    name: 'Информация',
    items: [
      { slug: 'prochie-raboty', title: 'Прочие работы', desc: 'Технологии: CAD/CAM, wax-up, mock-up, материалы, окклюзия.' },
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
