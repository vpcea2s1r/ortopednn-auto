#!/usr/bin/env node
// Rewrites the Endpoint host in AmneziaWG client configs to a stable domain
// and checks that required lines are present.
//
// Usage:
//   node scripts/vpn-endpoint-domain.mjs <dir> [--apply] [--host panel.ortopednn.ru]
//
// Default mode is dry-run: nothing is written, only a report is printed.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith('--'));
const apply = args.includes('--apply');
const hostArg = args.indexOf('--host');
const host = hostArg >= 0 ? args[hostArg + 1] : 'panel.ortopednn.ru';

if (!dir) {
  console.error('usage: node scripts/vpn-endpoint-domain.mjs <dir> [--apply] [--host panel.ortopednn.ru]');
  process.exit(2);
}

const required = ['[Interface]', 'PrivateKey =', 'Address =', '[Peer]', 'PublicKey =', 'Endpoint ='];
const optional = ['HeaderProtectionKey =', 'Jc =', 'S1 =', 'H1 ='];

const files = readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.conf')).sort();
if (files.length === 0) {
  console.error(`no .conf files in ${dir}`);
  process.exit(1);
}

let changed = 0;
let problems = 0;

for (const file of files) {
  const path = join(dir, file);
  const text = readFileSync(path, 'utf8');
  const lines = text.split(/\r?\n/);

  const missing = required.filter((key) => !text.includes(key));
  const hasOptional = optional.filter((key) => text.includes(key)).length;

  let endpointOld = null;
  let endpointNew = null;
  const out = lines.map((line) => {
    const m = line.match(/^(\s*Endpoint\s*=\s*)([^:\s]+)(:\d+)\s*$/i);
    if (!m) return line;
    endpointOld = m[2] + m[3];
    endpointNew = host + m[3];
    return m[1] + host + m[3];
  });

  const status = missing.length === 0 ? 'ok' : `MISSING: ${missing.join(', ')}`;
  const change = endpointOld && endpointOld !== endpointNew ? `${endpointOld} -> ${endpointNew}` : 'already set';
  console.log(`${file}\n  fields: ${status} (obfuscation lines: ${hasOptional}/${optional.length})\n  endpoint: ${change}`);

  if (missing.length > 0) problems++;
  if (endpointOld && endpointOld !== endpointNew) {
    changed++;
    if (apply) writeFileSync(path, out.join('\n'), 'utf8');
  }
}

console.log(`\nfiles: ${files.length}, endpoint rewrites: ${changed}, files with problems: ${problems}`);
console.log(apply ? 'mode: applied' : 'mode: dry-run (add --apply to write)');
process.exit(problems > 0 ? 1 : 0);
