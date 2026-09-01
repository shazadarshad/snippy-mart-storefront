/**
 * Set FCM secrets on Supabase from local service account JSON.
 * Usage: node scripts/set-fcm-secrets.mjs "C:\\Users\\...\\serviceAccount.json"
 */
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { spawnSync } from 'child_process';
import { resolve } from 'path';

const keyPath = process.argv[2];
const projectRef = process.argv[3] || 'aioyoxnjukfibsogegdb';

if (!keyPath) {
  console.error('Usage: node scripts/set-fcm-secrets.mjs <path-to-serviceAccount.json>');
  process.exit(1);
}

const abs = resolve(keyPath);
const raw = readFileSync(abs, 'utf8');
const sa = JSON.parse(raw);
if (!sa.private_key || !sa.client_email) {
  console.error('Invalid service account JSON');
  process.exit(1);
}

const projectId = sa.project_id || 'snippymart-41d5f';
const oneLine = JSON.stringify(sa);

// supabase secrets set --env-file expects KEY=VALUE (VALUE may contain =)
// Use JSON string as value; no wrapping quotes so whole object is the value
const envFile = resolve('tmp-fcm-secrets.env');
writeFileSync(envFile, `FCM_PROJECT_ID=${projectId}\nFCM_SERVICE_ACCOUNT_JSON=${oneLine}\n`, 'utf8');

const bin = resolve('node_modules/supabase/bin/supabase.exe');
const r1 = spawnSync(
  bin,
  ['secrets', 'set', '--env-file', envFile, '--project-ref', projectRef],
  { encoding: 'utf8', shell: false },
);
console.log(r1.stdout || '');
console.error(r1.stderr || '');
try {
  unlinkSync(envFile);
} catch {
  /* ignore */
}

if (r1.status !== 0) {
  console.error('secrets set failed', r1.status, r1.error);
  process.exit(r1.status || 1);
}

const r2 = spawnSync(bin, ['secrets', 'list', '--project-ref', projectRef], {
  encoding: 'utf8',
  shell: false,
});
console.log(r2.stdout || '');
console.error(r2.stderr || '');
console.log('OK: FCM_PROJECT_ID + FCM_SERVICE_ACCOUNT_JSON set');
