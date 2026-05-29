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
    'apt-cache search docker-compose 2>&1',
    'ls /usr/libexec/docker/cli-plugins/ 2>&1',
    'which docker-compose 2>&1 || echo "no docker-compose"',
    'docker compose version 2>&1 || docker-compose --version 2>&1 || echo "no compose"',
  ];
  for (const cmd of cmds) {
    const r = await run(cmd);
    console.log(`$ ${cmd}\n${r.out}\n---`);
  }
  conn.end();
});
conn.on('error', (e) => { console.error(e.message); process.exit(1); });
conn.connect({ host: '94.183.155.147', port: 22, username: 'root', password: 'fefbfbhTTT7777&', tryKeyboard: true, readyTimeout: 15000 });
