/**
 * One-shot: polish API product titles/descriptions and print SQL or call via env.
 * Usage: node scripts/fix-junk-descriptions.mjs
 */
import fs from 'fs';
import {
  polishProductTitle,
  polishProductDescription,
  hasSellerJunk,
} from '../src/lib/resellerProductCopy.ts';

const name = polishProductTitle('Factory 12m');
const description = polishProductDescription({
  title: name,
  apiDescription:
    'Duration: 12 Month Official Coupon Code No Warranty After Activation On Your Account.',
});

if (hasSellerJunk(description) || /ce:/i.test(description)) {
  console.error('Generated description still has junk!');
  process.exit(1);
}

const esc = (s) => s.replace(/'/g, "''");
const sql = `UPDATE public.products
SET
  name = '${esc(name)}',
  description = '${esc(description)}'
WHERE id = '67535865-98c4-45e6-89a9-16da1755a8b7'
   OR (
     reseller_product_id IS NOT NULL
     AND (
       description ILIKE '%ce:%'
       OR description ILIKE '%{%}%'
       OR name ILIKE '%12m%'
     )
   );

SELECT id, name, left(description, 160) AS preview
FROM public.products
WHERE id = '67535865-98c4-45e6-89a9-16da1755a8b7';
`;

fs.writeFileSync('fix_desc.sql', sql, 'utf8');
fs.writeFileSync(
  'fix_payload.json',
  JSON.stringify({ query: sql }),
  'utf8',
);
console.log('name:', name);
console.log('description chars:', description.length);
console.log('wrote fix_desc.sql and fix_payload.json');
console.log('--- preview ---');
console.log(description);
