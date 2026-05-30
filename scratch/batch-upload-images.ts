import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { v2 as cloudinary } from "cloudinary";

// 1. Initialize Env Config
dotenv.config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set in environment.");
  process.exit(1);
}

// 2. Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// 3. Initialize Prisma Client
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// 4. Constants
const BATCH_IMAGES_DIR = path.join(process.cwd(), "scratch", "batch-images");
const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
const CONCURRENCY_LIMIT = 5; // Number of parallel uploads

async function batchUpload() {
  console.log("🚀 STARTING BATCH PRODUCT IMAGE UPLOADER");
  
  if (!fs.existsSync(BATCH_IMAGES_DIR)) {
    console.error(`❌ Folder not found at ${BATCH_IMAGES_DIR}. Please create it first.`);
    return;
  }

  // 1. Read files in directory
  const files = fs.readdirSync(BATCH_IMAGES_DIR);
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ALLOWED_EXTENSIONS.includes(ext);
  });

  if (imageFiles.length === 0) {
    console.log(`⚠️ No supported images found in ${BATCH_IMAGES_DIR}.`);
    console.log(`💡 Supported formats: ${ALLOWED_EXTENSIONS.join(", ")}`);
    return;
  }

  console.log(`📂 Found ${imageFiles.length} image files to process.`);

  // 2. Fetch all products and variants from DB to match in memory (fast)
  console.log("📥 Loading catalog metadata from database...");
  const variants = await prisma.productVariant.findMany({
    include: {
      product: true
    }
  });

  // Maps to find products quickly
  const skuMap = new Map<string, any>();
  const barcodeMap = new Map<string, any>();

  variants.forEach(v => {
    if (v.sku) skuMap.set(v.sku.toLowerCase().trim(), v);
    if (v.barcode) barcodeMap.set(v.barcode.toLowerCase().trim(), v);
  });

  console.log(`📦 Loaded ${variants.length} active variants for matching.`);

  // 3. Match image files with products
  const matchedTasks: { filePath: string; fileName: string; variant: any }[] = [];
  const unmatchedFiles: string[] = [];

  for (const fileName of imageFiles) {
    const filePath = path.join(BATCH_IMAGES_DIR, fileName);
    const baseName = path.parse(fileName).name.toLowerCase().trim();

    // Check SKU first
    let matchedVariant = skuMap.get(baseName);
    
    // Check Barcode second
    if (!matchedVariant) {
      matchedVariant = barcodeMap.get(baseName);
    }

    if (matchedVariant) {
      matchedTasks.push({
        filePath,
        fileName,
        variant: matchedVariant
      });
    } else {
      unmatchedFiles.push(fileName);
    }
  }

  console.log(`✨ Matched ${matchedTasks.length} images to product records.`);
  if (unmatchedFiles.length > 0) {
    console.log(`⚠️ Unmatched images (${unmatchedFiles.length}):`);
    unmatchedFiles.slice(0, 10).forEach(f => console.log(`   - ${f}`));
    if (unmatchedFiles.length > 10) console.log(`   ... and ${unmatchedFiles.length - 10} more.`);
  }

  if (matchedTasks.length === 0) {
    console.log("🛑 No matches found. Make sure your image filenames match the SKUs or Barcodes exactly.");
    return;
  }

  // 4. Perform uploads in limited concurrent chunks
  console.log(`\n☁️ Uploading matched assets to Cloudinary (Concurrency: ${CONCURRENCY_LIMIT})...`);
  
  let successCount = 0;
  let failCount = 0;
  
  const uploadTask = async (task: typeof matchedTasks[0], index: number) => {
    const product = task.variant.product;
    const progress = `[${index + 1}/${matchedTasks.length}]`;
    
    try {
      console.log(`${progress} Uploading "${task.fileName}" for product: "${product.name}" (SKU: ${task.variant.sku})...`);
      
      const result = await cloudinary.uploader.upload(task.filePath, {
        folder: "nextgenfashion/products",
        resource_type: "image",
      });

      const cloudinaryUrl = result.secure_url;
      
      // Update database product images
      await prisma.product.update({
        where: { id: product.id },
        data: {
          images: {
            set: [cloudinaryUrl] // Overwrite current array with the new primary image
          }
        }
      });

      console.log(`✅ ${progress} Successfully uploaded & linked to: "${product.name}"`);
      successCount++;
    } catch (err: any) {
      console.error(`❌ ${progress} Failed to process "${task.fileName}":`, err.message || err);
      failCount++;
    }
  };

  // Process chunk by chunk
  for (let i = 0; i < matchedTasks.length; i += CONCURRENCY_LIMIT) {
    const chunk = matchedTasks.slice(i, i + CONCURRENCY_LIMIT);
    await Promise.all(chunk.map((task, index) => uploadTask(task, i + index)));
  }

  console.log("\n📊 BATCH COMPLETED SUMMARY:");
  console.log(`   🔹 Total Matched: ${matchedTasks.length}`);
  console.log(`   🔹 Successfully Synced: ${successCount}`);
  console.log(`   🔹 Failed: ${failCount}`);
  console.log(`   🔹 Unmatched Files: ${unmatchedFiles.length}`);
}

// batchUpload()
//   .catch(console.error)
//   .finally(async () => {
//     await prisma.$disconnect();
//     await pool.end();
//   });
