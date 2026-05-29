const { Client } = require('ssh2');
const conn = new Client();

function execCmd(cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', d => out += d.toString());
      stream.stderr.on('data', d => out += d.toString());
      stream.on('close', code => resolve({ out, code }));
    });
  });
}

conn.on('ready', async () => {
  try {
    // Check journal for error
    let r = await execCmd('journalctl -u opencode-serve --no-pager -n 30 2>&1');
    console.log('journal:', r.out);
    
    // Try running directly to see error
    r = await execCmd('export PATH="$HOME/.opencode/bin:$PATH"; opencode serve --port 4096 --hostname 0.0.0.0 2>&1 &
sleep 3
curl -s http://127.0.0.1:4096/global/health 2>&1 || true
kill %1 2>/dev/null || true');
    console.log('direct test:', r.out.slice(-1000));
    
  } catch(e) { console.error(e); }
  conn.end();
}).on('error', e => console.error(e.message))
.connect({ host: '94.183.155.147', port: 22, username: 'root', password: 'fefbfbhTTT7777&' });
