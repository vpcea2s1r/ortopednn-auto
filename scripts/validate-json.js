import fs from 'fs';

const f = ['doctor.json', 'pricing.json', 'socials.json', 'faq.json', 'districts.json', 'map-services.json'];

f.forEach(x => {
  try {
    JSON.parse(fs.readFileSync(`data/${x}`, 'utf8'));
    console.log(`✅ ${x}`);
  } catch (e) {
    console.error(`❌ ${x}: ${e.message}`);
    process.exit(1);
  }
});