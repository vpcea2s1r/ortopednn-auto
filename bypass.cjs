const { Client } = require('ssh2');

const HOST = '94.183.155.147';
const PORT = 22;
const USER = 'root';
const PASS = 'fefbfbhTTT7777&';

async function exec(stream, cmd, t = 10000) {
  return new Promise((resolve) => {
    let out = ''; let done = false;
    const timer = setTimeout(() => { if (!done) { done = true; resolve(out.trim() + '\n[TIMEOUT]'); } }, t);
    stream.exec(cmd, (err, s) => {
      if (err) { clearTimeout(timer); resolve(err.message); return; }
      s.on('close', () => { if (!done) { clearTimeout(timer); done = true; resolve(out.trim()); } });
      s.on('data', (d) => out += d.toString()); s.stderr.on('data', (d) => out += d.toString());
    });
  });
}

const conn = new Client();
conn.on('ready', async () => {
  console.log('Connected\n');
  try {
    // Apply MSS clamping to bypass DPI
    console.log('--- Applying MSS clamping ---');
    let r = await exec(conn, 'iptables -t mangle -I FORWARD -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --set-mss 1000 2>&1');
    console.log(`FORWARD: ${r}`);
    r = await exec(conn, 'iptables -t mangle -I OUTPUT -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --set-mss 1000 2>&1');
    console.log(`OUTPUT: ${r}`);
    r = await exec(conn, 'iptables -t mangle -I INPUT -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --set-mss 1000 2>&1');
    console.log(`INPUT: ${r}\n`);

    // Make persistent
    r = await exec(conn, 'apt-get install -y -qq iptables-persistent 2>&1', 30000);
    console.log(`iptables-persistent: exit? ${r.slice(-100)}\n`);

    // Save rules
    r = await exec(conn, 'netfilter-persistent save 2>&1; iptables-save > /etc/iptables/rules.v4 2>&1; echo OK');
    console.log(`Save: ${r}\n`);

    // Restart container to re-connect
    r = await exec(conn, 'cd /opt/ortopednn-auto && docker compose -f docker-compose.yml --env-file server/.env restart bot 2>&1');
    console.log(`Restart: ${r.slice(-200)}\n`);

    // Wait and check
    await new Promise(r => setTimeout(r, 5000));

    // Test from container
    r = await exec(conn, 'docker exec ortopednn-bot wget -q -O- --timeout=5 https://api.telegram.org/bot8992312371:AAEmKcm3WLeTfOjGQrM1-P8XE8yyiTmnSEM/getMe 2>&1');
    console.log(`Telegram test:\n${r.slice(0, 500)}\n`);

    // Logs
    r = await exec(conn, 'docker logs ortopednn-bot --tail 10 2>&1');
    console.log(`Bot logs:\n${r}`);

  } catch (e) { console.error('Failed:', e.message); }
  conn.end(); process.exit(0);
});
conn.on('error', (e) => { console.error('Error:', e.message); process.exit(1); });
conn.connect({ host: HOST, port: PORT, username: USER, password: PASS });
