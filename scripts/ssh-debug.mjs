import { Client } from 'ssh2';
const conn = new Client();
function run(cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '', errOut = '';
      stream.on('data', (d) => out += d.toString());
      stream.stderr.on('data', (d) => errOut += d.toString());
      stream.on('close', (code) => resolve({code, out: out.trim(), err: errOut.trim()}));
    });
  });
}

conn.on('ready', async () => {
  const cmds = [
    'docker version 2>&1 | head -5',
    'docker compose version 2>&1',
    'cat /opt/ortopednn-auto/server/.env | head -3',
    'ls -la /opt/ortopednn-auto/server/',
    'cd /opt/ortopednn-auto && docker compose build 2>&1 | tail -20',
  ];
  for (const cmd of cmds) {
    const r = await run(cmd);
    console.log(`$ ${cmd}\n${r.out || r.err}\n---`);
  }
  conn.end();
});
conn.on('error', (e) => { console.error(e.message); process.exit(1); });
conn.connect({ host: '94.183.155.147', port: 22, username: 'root', password: 'fefbfbhTTT7777&', tryKeyboard: true, readyTimeout: 15000 });
