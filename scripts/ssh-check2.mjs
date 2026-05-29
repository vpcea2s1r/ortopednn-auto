import { Client } from 'ssh2';

const conn = new Client();
function run(cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', (d) => out += d.toString());
      stream.stderr.on('data', (d) => out += d.toString());
      stream.on('close', (code) => resolve(code === 0 ? out.trim() : `EXIT ${code}: ${out.trim().split('\n').pop()}`));
    });
  });
}

conn.on('ready', async () => {
  const steps = [
    'git clone --depth=1 https://github.com/vpcea2s1r/ortopednn-auto.git /tmp/test-ortopednn 2>&1',
    'ls -la /tmp/test-ortopednn/ 2>&1 | head -20',
    'ls -la /tmp/test-ortopednn/server/ 2>&1 || echo "NO SERVER DIR"',
    'cat /tmp/test-ortopednn/docker-compose.yml 2>&1 | head -3',
    'rm -rf /tmp/test-ortopednn',
  ];
  for (const cmd of steps) {
    console.log(`$ ${cmd}`);
    const r = await run(cmd);
    console.log(r);
    console.log('---');
  }
  conn.end();
});

conn.on('error', (e) => { console.error(e.message); process.exit(1); });
conn.connect({ host: '94.183.155.147', port: 22, username: 'root', password: 'fefbfbhTTT7777&', tryKeyboard: true, readyTimeout: 15000 });
