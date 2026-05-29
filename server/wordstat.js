import fetch from 'node-fetch';

const YANDEX_OAUTH = process.env.YANDEX_OAUTH_TOKEN;
const API = 'https://api.wordstat.yandex.net/v1';

async function getRegionsTree() {
  const resp = await fetch(`${API}/getRegionsTree`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${YANDEX_OAUTH}`, 'Content-Type': 'application/json' }
  });
  return resp.json();
}

async function topRequests(phrase, regions, devices = ['all']) {
  const resp = await fetch(`${API}/topRequests`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${YANDEX_OAUTH}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ phrase, regions, devices })
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Wordstat API ${resp.status}: ${text}`);
  }
  return resp.json();
}

async function dynamics(phrase, period = 'monthly', fromDate = '2025-01-01', toDate, regions, devices = ['all']) {
  const resp = await fetch(`${API}/dynamics`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${YANDEX_OAUTH}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ phrase, period, fromDate, toDate, regions, devices })
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Wordstat API ${resp.status}: ${text}`);
  }
  return resp.json();
}

async function regions(phrase, regionType = 'cities', devices = ['all']) {
  const resp = await fetch(`${API}/regions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${YANDEX_OAUTH}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ phrase, regionType, devices })
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Wordstat API ${resp.status}: ${text}`);
  }
  return resp.json();
}

// Region IDs: 47 = Нижегородская область, 225 = Россия
const NN_REGION = 47;
// Нижний Новгород city ID in the tree

async function main() {
  if (!YANDEX_OAUTH) {
    console.error('YANDEX_OAUTH_TOKEN not set');
    process.exit(1);
  }

  const phrases = [
    'протезирование зубов',
    'коронки на зубы',
    'съёмные протезы',
    'бюгельный протез',
    'мостовидный протез',
    'металлокерамика',
    'циркониевые коронки',
    'зубной протез',
    'восстановление зубов',
    'консультация ортопеда',
    'коронка на зуб',
    'протезирование зубов цена',
    'съемный протез цена',
    'бюгельный протез цена',
    'ремонт протезов',
    'временная коронка',
    'нейлоновые протезы',
    'акриловый протез',
    'протезирование на имплантах цена',
    'уход за протезами',
    'выпала коронка',
    'болит под коронкой',
    'сколько стоит коронка',
    'протезы для зубов',
    'безметалловая керамика',
    'E-max коронки',
    'цельнолитая коронка',
    'восстановление зуба',
    'поставить коронку',
    'какой протез лучше'
  ];

  console.log('=== Wordstat API — topRequests ===');
  console.log(`Регион: Нижегородская область (${NN_REGION})\n`);

  for (const phrase of phrases) {
    try {
      const data = await topRequests(phrase, [NN_REGION]);
      const requests = data.topRequests || [];
      console.log(`\n--- ${phrase} ---`);
      console.log(`Всего показов: ${data.totalCount || 'N/A'}`);
      for (const r of requests.slice(0, 10)) {
        console.log(`  ${r.phrase} — ${r.count}`);
      }
    } catch (e) {
      console.error(`\n--- ${phrase} ---`);
      console.error(`  Error: ${e.message}`);
    }
  }
}

main();
