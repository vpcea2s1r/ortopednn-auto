// Migrate topics.json → Redis queue
// Usage: node scripts/migrate-redis.js
// Requires Redis running and REDIS_URL env (defaults to redis://localhost:6379)

const { enqueueBulk, connect, disconnect } = require('../server/bridge');
const fs = require('fs');
const path = require('path');

async function main() {
  const topicsPath = path.join(__dirname, '..', 'server', 'topics.json');
  if (!fs.existsSync(topicsPath)) {
    console.log('topics.json not found, nothing to migrate');
    process.exit(0);
  }

  await connect();
  const topics = JSON.parse(fs.readFileSync(topicsPath, 'utf-8'));
  const pending = topics.filter(t => t.status === 'pending');

  if (!pending.length) {
    console.log('No pending topics to migrate');
    await disconnect();
    process.exit(0);
  }

  await enqueueBulk(pending.map(t => ({
    topic: t.topic,
    added: t.added,
    ctx: {}
  })));

  console.log(`OK: ${pending.length} topics migrated to Redis`);
  await disconnect();
}

main().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
