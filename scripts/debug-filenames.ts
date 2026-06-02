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
  const assets: any[] = [];
  let nextCursor = undefined;
  do {
    const result = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'image',
      prefix: 'nextgenfashion/products',
      max_results: 500,
      next_cursor: nextCursor,
    });
    assets.push(...(Array.isArray(result.resources) ? result.resources : []));
    nextCursor = result.next_cursor;
  } while (nextCursor);

  console.log('Cloudinary filename patterns:\n');
  const prefixes = new Set<string>();
  for (const asset of assets.slice(0, 20)) {
    const filename = (asset.public_id || '').split('/').pop() || '';
    console.log(`Filename: ${filename}`);
    
    // Try different extraction patterns
    const parts = filename.split('-');
    console.log(`  Parts: ${JSON.stringify(parts)}`);
    
    // The ID seems to be one of the last parts before the timestamp
    const lastTimestampMatch = filename.match(/-(\d{10,})/);
    if (lastTimestampMatch) {
      const beforeTimestamp = filename.substring(0, lastTimestampMatch.index);
      const lastPart = beforeTimestamp.split('-').pop();
      console.log(`  ID candidate: ${lastPart}`);
      if (lastPart && lastPart.length >= 4) {
        prefixes.add(lastPart);
      }
    }
    console.log('');
  }

  console.log(`\nUnique ID prefixes found: ${Array.from(prefixes).join(', ')}`);
}

main().catch(console.error);
