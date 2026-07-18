/**
 * Regenerate brand-v2 style image for a product and print SQL update.
 */
import fs from 'fs';
import { resolveCustomerProductImage, polishProductTitle } from '../src/lib/resellerProductCopy.ts';

const id = process.argv[2] || '67535865-98c4-45e6-89a9-16da1755a8b7';
const name = process.argv[3] || 'Factory 12 Months';

const image_url = await resolveCustomerProductImage(name);
const title = polishProductTitle(name);
const esc = (s) => s.replace(/'/g, "''");

const sql = `UPDATE public.products
SET name = '${esc(title)}',
    image_url = '${esc(image_url)}'
WHERE id = '${id}'
RETURNING id, name, left(image_url, 60) AS img;`;

fs.writeFileSync('fix_payload.json', JSON.stringify({ query: sql }));
console.log('title', title);
console.log('image bytes', image_url.length);
console.log('wrote fix_payload.json');
