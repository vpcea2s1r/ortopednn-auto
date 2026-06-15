import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RULES = JSON.parse(readFileSync(join(__dirname, 'humanizer-rules.json'), 'utf-8'));

/* ponytail: simple sentence splitter, misses edge cases */
function splitSentences(text) {
  return text.replace(/<[^>]+>/g, '').split(/[.!?]+/).filter(s => s.trim().length > 10);
}

function splitParagraphs(text) {
  return text.replace(/<[^>]+>/g, '').split(/\n\s*\n|<p>/).filter(p => p.trim().length > 20);
}

function countWords(text) {
  return (text.replace(/<[^>]+>/g, '').match(/[а-яёa-z]+/gi) || []).length;
}

/* --- score_ai(): 6-heuristic AI detection --- */

export function score_ai(text) {
  const clean = text.replace(/<[^>]+>/g, '');
  const sentences = splitSentences(clean);
  const paras = splitParagraphs(clean);
  const words = clean.match(/[а-яёa-z]+/gi) || [];
  const wordCount = words.length;
  const lower = clean.toLowerCase();

  if (sentences.length < 3 || wordCount < 50) return { score: 0.5, details: { error: 'too_short' } };

  /* 1. Sentence uniformity — how many are close to mean length */
  const sentLens = sentences.map(s => s.trim().length);
  const meanSentLen = sentLens.reduce((a, b) => a + b, 0) / sentLens.length;
  const uniformThreshold = meanSentLen * 0.2;
  const uniformCount = sentLens.filter(l => Math.abs(l - meanSentLen) <= uniformThreshold).length;
  const uniformityScore = 1 - (uniformCount / sentLens.length);
  /* low uniformity = high AI similarity = low score */

  /* 2. Banned word density */
  const allBanned = [...RULES.en.banned_words, ...RULES.ru.words];
  let bannedCount = 0;
  for (const w of allBanned) {
    const re = new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&') + '\\b', 'gi');
    const m = lower.match(re);
    if (m) bannedCount += m.length;
  }
  const bannedDensity = bannedCount / Math.max(wordCount, 1);
  const bannedScore = Math.max(0, 1 - (bannedDensity / RULES.thresholds.ai_banned_word_density_warn));

  /* 3. Passive voice heuristic — "ся" ending + "быть" participles */
  const passivePatterns = [
    /[а-яё]+ся\b/gi,
    /\b(?:был(?:о|а|и)?|буд(?:ет|ут|ь|я)|явля(?:ется|ются|лся|лась|лись))\s+[а-яё]+(?:н(?:ый|ая|ое|ые|о|а|ы)|т(?:ый|ая|ое|ые|о|а|ы))\b/gi
  ];
  let passiveCount = 0;
  for (const re of passivePatterns) {
    const m = clean.match(re);
    if (m) passiveCount += m.length;
  }
  const passiveRatio = passiveCount / Math.max(wordCount, 1);
  const passiveScore = Math.max(0, 1 - Math.min(passiveRatio * 20, 1));

  /* 4. Paragraph variety — std dev of sentence count per paragraph */
  const paraSentCounts = paras.map(p => splitSentences(p).length);
  const meanParaSents = paraSentCounts.reduce((a, b) => a + b, 0) / paraSentCounts.length;
  const paraVar = paraSentCounts.reduce((a, b) => a + (b - meanParaSents) ** 2, 0) / paraSentCounts.length;
  const paraCV = Math.sqrt(paraVar) / Math.max(meanParaSents, 1);
  const paraScore = Math.min(paraCV / 0.5, 1);

  /* 5. Sentence length variance */
  const sentVar = sentLens.reduce((a, b) => a + (b - meanSentLen) ** 2, 0) / sentLens.length;
  const sentCV = Math.sqrt(sentVar) / Math.max(meanSentLen, 1);
  const sentVarScore = Math.min(sentCV / 0.5, 1);

  /* 6. Em-dash overuse */
  const emDashCount = (clean.match(/—/g) || []).length;
  const emDashRatio = emDashCount / Math.max(paras.length, 1);
  const emDashScore = Math.max(0, 1 - Math.max(0, emDashRatio - RULES.thresholds.em_dash_max_ratio));

  const w = RULES.ai_score_weights;
  const weighted = uniformityScore * w.sentence_uniformity
    + bannedScore * w.banned_word_density
    + passiveScore * w.passive_voice
    + paraScore * w.paragraph_variety
    + sentVarScore * w.sentence_length_variance
    + emDashScore * w.em_dash_overuse;

  return {
    score: Math.round(weighted * 100) / 100,
    details: { uniformityScore, bannedScore, passiveScore, paraScore, sentVarScore, emDashScore, bannedDensity }
  };
}

/* --- score_seo(): keyword density, headings, word count, readability --- */

export function score_seo(text, keyword) {
  const clean = text.replace(/<[^>]+>/g, '');
  const words = clean.match(/[а-яёa-z]+/gi) || [];
  const wordCount = words.length;
  const lower = clean.toLowerCase();

  /* 1. Keyword density */
  const kwParts = (keyword || '').toLowerCase().split(/\s+/).filter(Boolean);
  let kwCount = 0;
  if (kwParts.length) {
    for (const p of kwParts) {
      const m = lower.match(new RegExp('\\b' + p.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&') + '\\b', 'gi'));
      if (m) kwCount += m.length;
    }
  }
  const kwDensity = kwCount / Math.max(wordCount, 1);
  /* ideal 1-3% */
  let kwScore = 0;
  if (kwDensity >= 0.005 && kwDensity <= 0.05) kwScore = 1;
  else if (kwDensity > 0 && kwDensity < 0.005) kwScore = kwDensity / 0.005;
  else kwScore = Math.max(0, 1 - (kwDensity - 0.05) * 10);

  /* 2. Heading structure */
  const h2Count = (text.match(/<h2\b[^>]*>/gi) || []).length;
  const h3Count = (text.match(/<h3\b[^>]*>/gi) || []).length;
  const hasIntro = text.indexOf('<h2') > 100 || text.indexOf('<h2') === -1;
  let headingScore = 0;
  if (h2Count >= 3) headingScore += 0.5;
  else if (h2Count >= 2) headingScore += 0.3;
  else if (h2Count >= 1) headingScore += 0.2;
  if (h3Count >= 2) headingScore += 0.3;
  if (hasIntro) headingScore += 0.2;

  /* 3. Word count */
  const minWC = RULES.thresholds.min_word_count;
  const idealWC = 2000;
  let wcScore = 0;
  if (wordCount >= minWC) wcScore = Math.min(wordCount / idealWC, 1);

  /* 4. Internal links */
  const linkCount = (text.match(/<a\b[^>]+href\s*=\s*["']\/(?!\/)/gi) || []).length;
  let linkScore = 0;
  if (linkCount >= 2) linkScore = 1;
  else if (linkCount === 1) linkScore = 0.5;

  /* 5. Readability — avg word length */
  const totalChars = words.reduce((a, w) => a + w.length, 0);
  const avgWordLen = totalChars / Math.max(wordCount, 1);
  let readScore = 0;
  if (avgWordLen < 7) readScore = 1;
  else if (avgWordLen < 10) readScore = 0.6;
  else readScore = 0.2;

  const w = RULES.seo_score_weights;
  const weighted = kwScore * w.keyword_density
    + headingScore * w.heading_structure
    + wcScore * w.word_count
    + linkScore * w.internal_links
    + readScore * w.readability;

  return {
    score: Math.round(weighted * 100) / 100,
    details: { kwScore, headingScore, wcScore, linkScore, readScore, wordCount, kwDensity }
  };
}

/* --- composite_score(): weighted score + audit gate --- */

export function composite_score(text, keyword) {
  const ai = score_ai(text);
  const seo = score_seo(text, keyword);

  /* quality score: simplified — high AI score + high banned density = low quality */
  let qualityScore = 1;
  if (ai.details?.bannedDensity > 0.03) qualityScore -= 0.2;
  if (ai.details?.uniformityScore < 0.3) qualityScore -= 0.2;
  qualityScore = Math.max(0, qualityScore);

  const w = RULES.composite_weights;
  const composite = qualityScore * w.quality + ai.score * w.ai_detection + seo.score * w.seo;

  const thresholds = RULES.thresholds;
  const audit = {
    pass: true,
    reasons: []
  };
  if (composite < thresholds.composite_minimum) {
    audit.pass = false;
    audit.reasons.push(`composite ${composite.toFixed(2)} < ${thresholds.composite_minimum}`);
  }
  if (ai.score < 0.4) {
    audit.pass = false;
    audit.reasons.push(`ai_score ${ai.score.toFixed(2)} < 0.4`);
  }
  if (seo.score < 0.4) {
    audit.pass = false;
    audit.reasons.push(`seo_score ${seo.score.toFixed(2)} < 0.4`);
  }

  return { score: Math.round(composite * 100) / 100, ai, seo, qualityScore, audit };
}

/* --- pass_plan(): auto-select article format based on topic --- */

export function pass_plan(topic) {
  const topicLower = topic.toLowerCase();
  const formats = RULES.article_formats;
  const scored = Object.entries(formats).map(([key, fmt]) => {
    const re = new RegExp(fmt.pattern, 'i');
    const match = re.test(topicLower);
    return { key, ...fmt, score: match ? 1 : 0 };
  }).filter(f => f.score > 0);

  if (scored.length === 0) return { key: 'explainer', ...formats.explainer };
  return scored.sort((a, b) => b.score - a.score)[0];
}

/* --- pass_fetch(): check existing articles for dedup --- */

export async function pass_fetch(topic, existingArticles) {
  if (!existingArticles) {
    const ghOwner = 'vpcea2s1r';
    const ghRepo = 'ortopednn-auto';
    const ghBranch = 'master';
    try {
      const resp = await fetch(
        `https://api.github.com/repos/${ghOwner}/${ghRepo}/git/trees/${ghBranch}?recursive=1`,
        { headers: { Accept: 'application/vnd.github.v3+json' }, signal: AbortSignal.timeout(10000) }
      );
      if (!resp.ok) return { exists: false, error: 'github_unavailable' };
      const data = await resp.json();
      existingArticles = (data.tree || [])
        .filter(t => t.path.startsWith('src/pages/blog/') && t.path.endsWith('.astro'))
        .map(t => t.path.replace('src/pages/blog/', '').replace('.astro', ''));
    } catch {
      return { exists: false, error: 'github_unavailable' };
    }
  }

  const slug = topic.toLowerCase().trim()
    .replace(/[а-яё]/g, c => ({'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'})[c] || c)
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 80);

  if (existingArticles.includes(slug)) return { exists: true, slug };

  /* title similarity check — token overlap */
  const topicTokens = new Set(topic.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  for (const art of existingArticles) {
    const artTokens = new Set(art.toLowerCase().split(/-/).filter(w => w.length > 3));
    const overlap = [...topicTokens].filter(t => artTokens.has(t)).length;
    const union = new Set([...topicTokens, ...artTokens]).size;
    if (union > 0 && overlap / union > 0.6) return { exists: true, slug: art };
  }

  return { exists: false, existingArticles };
}

/* humanize() using rules from config */

export function humanize(text) {
  if (!text) return text;
  let result = text;
  const ru = RULES.ru;

  for (const phrase of ru.phrases_for_removal) {
    result = result.replace(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '');
  }

  for (const word of ru.puffery_words) {
    result = result.replace(new RegExp('\\b' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi'), '');
  }

  for (const [from, to] of Object.entries(ru.replacements)) {
    result = result.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), to);
  }

  result = result.replace(/играет (?:важную|ключевую|решающую|огромную) роль[.,;]?\s*/gi, '');

  const emDashCount = (result.match(/—/g) || []).length;
  const pCount = (result.match(/<p>/g) || []).length;
  if (emDashCount > pCount * RULES.thresholds.em_dash_max_ratio) {
    const dashes = result.match(/—/g);
    if (dashes && dashes.length > 2) {
      let count = 0;
      result = result.replace(/—/g, () => { count++; return count % 2 === 0 ? ',' : '—'; });
    }
  }

  result = result.replace(/,{2,}/g, ',');
  result = result.replace(/\s{2,}/g, ' ');
  result = result.replace(/>\s+</g, '><');

  return result;
}

/* checkAiTells() using rules from config */

export function checkAiTells(body) {
  if (!body) return [];
  const text = body.replace(/<[^>]+>/g, '');
  const lower = text.toLowerCase();
  const tells = [];
  const ru = RULES.ru;
  const en = RULES.en;

  for (const word of en.banned_words) {
    if (new RegExp('\\b' + word.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&') + '\\b', 'i').test(text)) {
      tells.push({ tag: 'ai_word:' + word });
    }
  }

  for (const phrase of en.banned_phrases) {
    if (lower.includes(phrase)) tells.push({ tag: 'ai_phrase:' + phrase });
  }

  for (const p of en.patterns) {
    if (new RegExp(p.re, 'i').test(text)) tells.push({ tag: 'ai_pattern:' + p.tag });
  }

  for (const phrase of ru.phrases) {
    if (lower.includes(phrase)) tells.push({ tag: 'ru_phrase:' + phrase.substring(0, 30) });
  }

  for (const word of ru.words) {
    if (new RegExp('\\b' + word.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&') + '\\b', 'i').test(text)) {
      tells.push({ tag: 'ru_word:' + word.substring(0, 20) });
    }
  }

  for (const p of ru.patterns) {
    if (new RegExp(p.re, 'i').test(text)) tells.push({ tag: 'ru_pattern:' + p.tag });
  }

  const emDashes = (text.match(/—/g) || []).length;
  if (emDashes > 1) tells.push({ tag: 'ai_em_dash_overuse', detail: `${emDashes} em-dashes` });

  if (/[“”‘’]/.test(text)) tells.push({ tag: 'ai_smart_quotes' });

  return tells;
}

/* re-export rules for other modules */
export { RULES };
