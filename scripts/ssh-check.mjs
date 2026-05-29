import { Client } from 'ssh2';

const conn = new Client();

function run(cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', (d) => out += d.toString());
      stream.stderr.on('data', (d) => out += d.toString());
      stream.on('close', (code) => resolve(out.trim()));
    });
  });
}

conn.on('ready', async () => {
  console.log('Checking repo...');
  const [ls, branch, latest] = await Promise.all([
    run('ls -la /opt/ortopednn-auto/ 2>&1'),
    run('cd /opt/ortopednn-auto 2>/dev/null && git branch -a 2>&1 || echo "no repo"'),
    run('cd /opt/ortopednn-auto 2>/dev/null && git log --oneline -3 2>&1 || true'),
  ]);
  console.log('ls:', ls);
  console.log('branch:', branch);
  console.log('latest:', latest);
  conn.end();
});

conn.on('error', (e) => { console.error('SSH error:', e.message); process.exit(1); });
conn.connect({ host: '94.183.155.147', port: 22, username: 'root', password: 'fefbfbhTTT7777&', tryKeyboard: true, readyTimeout: 15000 });
