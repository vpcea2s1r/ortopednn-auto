import express from 'express';
import cron from 'node-cron';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || join(__dirname, '..', 'data');
const PORT = process.env.PORT || 3000;
const isWebhook = !!process.env.WEBHOOK_DOMAIN;

fs.mkdirSync(join(DATA_DIR, 'drafts'), { recursive: true });
fs.mkdirSync(join(DATA_DIR, 'stats'), { recursive: true });

let db;
function getDb() {
  if (db) return db;
  try {
    const Database = require('better-sqlite3');
    db = new Database(join(DATA_DIR, 'stats', 'stats.db'));
    db.pragma('journal_mode = WAL');
    db.exec(`CREATE TABLE IF NOT EXISTS stat_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE, source TEXT,
      total_indexed INTEGER, total_errors INTEGER,
      clicks INTEGER, impressions INTEGER, avg_position REAL,
      raw TEXT
    )`);
    return db;
  } catch {
    return { prepare: () => ({ all: () => [], run: () => {}, get: () => null }) };
  }
}

const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

app.post('/api/generate', async (req, res) => {
  try {
    const { topic } = req.body || {};
    if (!topic) return res.status(400).json({ error: 'topic required' });
    const { generate } = await import('./generator.js');
    const result = await generate(topic);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/pipeline/run', async (req, res) => {
  try {
    const { topic } = req.body || {};
    const pipeline = await import('./agent-pipeline.js');
    if (topic) {
      await pipeline.addTopic(topic);
      const result = await pipeline.runPipelineManual(topic);
      return res.json(result);
    }
    const result = await pipeline.pickAndRun();
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/pipeline/add', async (req, res) => {
  try {
    const { topic } = req.body || {};
    if (!topic) return res.status(400).json({ error: 'topic required' });
    const pipeline = await import('./agent-pipeline.js');
    const result = await pipeline.addTopic(topic);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/pipeline/topics', async (req, res) => {
  const pipeline = await import('./agent-pipeline.js');
  res.json(await pipeline.listTopics());
});

app.get('/api/pipeline/state', async (req, res) => {
  const pipeline = await import('./agent-pipeline.js');
  res.json(await pipeline.listState());
});

app.post('/api/preview/publish', async (req, res) => {
  try {
    const { slug } = req.body || {};
    if (!slug) return res.status(400).json({ error: 'slug required' });
    const pipeline = await import('./agent-pipeline.js');
    const dataDir = join(DATA_DIR, 'drafts');
    const draftFile = join(dataDir, `${slug}.json`);
    const metaFile = join(dataDir, `${slug}.meta.json`);
    if (!fs.existsSync(draftFile) && !fs.existsSync(metaFile)) {
      return res.status(404).json({ error: 'Draft not found' });
    }
    let draft;
    if (fs.existsSync(draftFile)) {
      draft = JSON.parse(fs.readFileSync(draftFile, 'utf-8'));
    } else {
      draft = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
    }
    const { publisherAgent } = await import('./agent-pipeline.js');
    const article = {
      slug: draft.slug, title: draft.title,
      description: draft.desc || draft.description || '',
      date: draft.date, body: draft.body || ''
    };
    const result = await publisherAgent(article);
    // Clean up local drafts
    ['json', 'astro', 'meta.json'].forEach(ext => {
      const p = join(dataDir, `${slug}.${ext}`);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });
    // Delete draft JSON from repo
    try {
      const existing = await pipeline.ghFetch(`data/drafts/${slug}.json`);
      if (existing?.sha) {
        await fetch(`https://api.github.com/repos/vpcea2s1r/ortopednn-auto/contents/data/drafts/${slug}.json`, {
          method: 'DELETE',
          headers: { Authorization: `token ${process.env.GH_TOKEN}` },
          body: JSON.stringify({ message: `draft: ${slug} [published]`, sha: existing.sha, branch: 'master' })
        });
      }
    } catch {}
    res.json({ ok: true, slug: result.slug, url: result.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/preview/delete', async (req, res) => {
  try {
    const { slug } = req.body || {};
    if (!slug) return res.status(400).json({ error: 'slug required' });
    const pipeline = await import('./agent-pipeline.js');
    const dataDir = join(DATA_DIR, 'drafts');
    // Clean up local drafts
    ['json', 'astro', 'meta.json'].forEach(ext => {
      const p = join(dataDir, `${slug}.${ext}`);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });
    // Delete from repo
    try {
      const existing = await pipeline.ghFetch(`data/drafts/${slug}.json`);
      if (existing?.sha) {
        await fetch(`https://api.github.com/repos/vpcea2s1r/ortopednn-auto/contents/data/drafts/${slug}.json`, {
          method: 'DELETE',
          headers: { Authorization: `token ${process.env.GH_TOKEN}` },
          body: JSON.stringify({ message: `draft: ${slug} [deleted]`, sha: existing.sha, branch: 'master' })
        });
      }
    } catch {}
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/drafts', (req, res) => {
  const dir = join(DATA_DIR, 'drafts');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.meta.json')) : [];
  res.json(files.map(f => {
    try { return JSON.parse(fs.readFileSync(join(dir, f), 'utf-8')); } catch { return null; }
  }).filter(Boolean));
});

app.get('/api/stats', (req, res) => {
  const rows = getDb().prepare('SELECT * FROM stat_snapshots ORDER BY date DESC LIMIT 60').all();
  res.json(rows);
});

app.post('/api/horizon/run', async (req, res) => {
  try {
    const pipeline = await import('./agent-pipeline.js');
    const result = await pipeline.runHorizonPipeline();
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

async function main() {
  const { startBot } = await import('./bot.js');
  const { setupCron } = await import('./cron.js');

  setupCron(getDb, DATA_DIR);
  startBot(isWebhook);

  app.listen(PORT, () => console.log(`Server on :${PORT}`));
}

main();
