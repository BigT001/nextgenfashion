import dotenv from 'dotenv';
dotenv.config();
import { v2 as cloudinary } from 'cloudinary';

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('Cloudinary credentials are not set.');
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function main() {
  const resources = [];
  let nextCursor = undefined;
  do {
    const result = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'image',
      prefix: 'nextgenfashion/products',
      max_results: 500,
      next_cursor: nextCursor,
    });
    resources.push(...(Array.isArray(result.resources) ? result.resources : []));
    nextCursor = result.next_cursor;
  } while (nextCursor);

  console.log(`\nTotal Cloudinary assets: ${resources.length}\n`);
  console.log('public_id,filename,secureUrl');
  for (const r of resources.slice(0, 100)) {
    const filename = r.public_id?.split('/').pop() || r.public_id || '';
    console.log(`"${r.public_id}","${filename}","${r.secure_url}"`);
  }
}

main().catch(console.error);
