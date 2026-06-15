import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const QUEUE_KEY = 'pipeline:queue';
const DEDUP_KEY = 'pipeline:dedup';
const STATE_KEY = 'pipeline:state';

let redis;
export function getRedis() {
  if (!redis) redis = new Redis(REDIS_URL, { maxRetriesPerRequest: 3, retryStrategy: t => Math.min(t * 100, 3000) });
  return redis;
}

export async function enqueue(topic, ctx = {}) {
  const r = getRedis();
  const task = JSON.stringify({ topic, added: new Date().toISOString(), status: 'pending', ...ctx });
  await r.lpush(QUEUE_KEY, task);
  return { ok: true, topic };
}

export async function enqueueBulk(items) {
  if (!items.length) return;
  const r = getRedis();
  const pipeline = r.pipeline();
  for (const item of items) {
    const task = JSON.stringify({ topic: item.topic, added: item.added || new Date().toISOString(), status: 'pending', ...item.ctx });
    pipeline.lpush(QUEUE_KEY, task);
  }
  await pipeline.exec();
  return { ok: true, count: items.length };
}

export async function dequeue() {
  const r = getRedis();
  const raw = await r.rpop(QUEUE_KEY);
  if (!raw) return null;
  return JSON.parse(raw);
}

export async function peek() {
  const r = getRedis();
  const raw = await r.lindex(QUEUE_KEY, -1);
  return raw ? JSON.parse(raw) : null;
}

export async function queueLength() {
  const r = getRedis();
  return r.llen(QUEUE_KEY);
}

export async function listQueue() {
  const r = getRedis();
  const items = await r.lrange(QUEUE_KEY, 0, -1);
  return items.map(i => JSON.parse(i));
}

export async function dedupCheck(slug) {
  const r = getRedis();
  return r.sismember(DEDUP_KEY, `${slug}`);
}

export async function dedupAdd(slug) {
  const r = getRedis();
  await r.sadd(DEDUP_KEY, `${slug}`);
}

export async function dedupRemove(slug) {
  const r = getRedis();
  await r.srem(DEDUP_KEY, `${slug}`);
}

export async function dedupBulkAdd(slugs) {
  if (!slugs.length) return;
  const r = getRedis();
  await r.sadd(DEDUP_KEY, ...slugs);
}

export async function dedupCount() {
  const r = getRedis();
  return r.scard(DEDUP_KEY);
}

export async function loadState() {
  const r = getRedis();
  const raw = await r.get(STATE_KEY);
  if (!raw) return { lastRun: null, generatedToday: 0, errors: [] };
  return JSON.parse(raw);
}

export async function saveState(state) {
  const r = getRedis();
  await r.set(STATE_KEY, JSON.stringify(state));
}

export async function connect() {
  const r = getRedis();
  await r.ping();
  console.log('Redis connected');
}

export async function disconnect() {
  if (redis) { redis.disconnect(); redis = null; }
}

export async function seedFromExisting(slugs) {
  const count = await dedupCount();
  if (count === 0 && slugs.length > 0) {
    await dedupBulkAdd(slugs);
    console.log(`Seeded dedup set with ${slugs.length} slugs`);
  }
}
