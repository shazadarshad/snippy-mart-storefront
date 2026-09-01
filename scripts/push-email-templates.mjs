import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, '../supabase/migrations/20260715_apple_email_templates.sql');
const sql = readFileSync(sqlPath, 'utf8');

const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpb3lveG5qdWtmaWJzb2dlZ2RiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI1MDQ4MCwiZXhwIjoyMTAzODI2NDgwfQ.o0V69mCQAt_grTEaLLgIcPvAlCH4fyOZBExVDC7Gm6I';
const base = 'https://aioyoxnjukfibsogegdb.supabase.co/rest/v1/email_templates';
const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

const re =
  /INSERT INTO email_templates \(template_key, name, subject, html_content, description, variables, is_active\)\s*VALUES\s*\(\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*\$\$([\s\S]*?)\$\$,\s*'([^']*)',\s*'(\[[^\]]+\])'::jsonb,\s*true\s*\)/g;

const templates = {};
let m;
while ((m = re.exec(sql)) !== null) {
  templates[m[1]] = {
    name: m[2],
    subject: m[3],
    html_content: m[4],
    description: m[5],
    variables: JSON.parse(m[6]),
    is_active: true,
  };
  console.log('parsed', m[1], 'html_len', m[4].length);
}

if (!templates.status_update) {
  throw new Error('status_update missing from SQL');
}

async function patch(key, body) {
  const res = await fetch(`${base}?template_key=eq.${key}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ ...body, updated_at: new Date().toISOString() }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${key} ${res.status} ${text.slice(0, 400)}`);
  }
  const data = text ? JSON.parse(text) : [];
  console.log('UPDATED', key, 'rows', Array.isArray(data) ? data.length : 0);
}

for (const key of [
  'order_confirmation',
  'order_delivered',
  'payment_rejected',
  'status_update',
]) {
  await patch(key, templates[key]);
}

// Legacy key still showing old UI in admin / any old callers
const st = templates.status_update;
await patch('order_status_update', {
  name: 'Status Update',
  subject: st.subject,
  html_content: st.html_content,
  description: 'Order status changes (Apple design)',
  variables: st.variables,
  is_active: true,
});

await patch('product_delivery', { is_active: false });

const listRes = await fetch(
  `${base}?select=template_key,is_active,subject,updated_at&order=template_key`,
  { headers: { apikey: serviceKey, Authorization: headers.Authorization } },
);
const list = await listRes.json();
for (const row of list) {
  console.log(
    `${row.template_key} | active=${row.is_active} | ${row.subject}`,
  );
}

const checkRes = await fetch(
  `${base}?template_key=eq.order_status_update&select=html_content`,
  { headers: { apikey: serviceKey, Authorization: headers.Authorization } },
);
const check = await checkRes.json();
const h = check[0]?.html_content || '';
console.log(
  'order_status_update apple=',
  /f5f5f7/.test(h),
  'logo=',
  /logo_url/.test(h),
  'Current status=',
  /Current status/.test(h),
);
console.log('Done.');
