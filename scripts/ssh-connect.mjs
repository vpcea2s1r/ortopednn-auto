import { readFileSync } from 'fs';
import { Client } from 'ssh2';
import { join } from 'path';

const conn = new Client();
const keyPath = join(process.env.USERPROFILE, '.ssh', 'id_rsa_vps');

conn.on('ready', () => {
  console.log('Connected to VPS');
  conn.exec('hostname && uname -a && cat /etc/os-release | head -3', (err, stream) => {
    if (err) { console.error('exec error:', err); conn.end(); return; }
    let output = '';
    stream.on('data', (d) => output += d.toString());
    stream.stderr.on('data', (d) => process.stderr.write(d));
    stream.on('close', () => {
      console.log(output.trim());
      conn.end();
    });
  });
});

conn.on('error', (err) => {
  console.error('Connection error:', err.message);
  process.exit(1);
});

conn.connect({
  host: '94.183.155.147',
  port: 22,
  username: 'root',
  password: 'fefbfbhTTT7777&',
  tryKeyboard: true,
  readyTimeout: 15000
});
