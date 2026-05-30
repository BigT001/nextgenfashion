import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { v2 as cloudinary } from "cloudinary";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Configure Cloudinary from environmental variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

interface CSVRow {
  productName: string;
  description: string;
  categoryName: string;
  gender: "BOYS" | "GIRLS" | "BOTH";
  basePrice: number;
  costPrice: number | null;
  tax: number | null;
  imageFilename: string;
  sku: string;
  barcode: string | null;
  size: string | null;
  color: string | null;
  variantPrice: number | null;
  stockQuantity: number;
  lowStockThreshold: number;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function run() {
  console.log("\n⚡ NEXTGEN FASHION BULK PRODUCT IMPORTER");
  console.log("=========================================\n");

  const csvPath = path.join(__dirname, "import_template.csv");
  const imagesDir = path.join(__dirname, "images");

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Error: Template file not found at ${csvPath}`);
    process.exit(1);
  }

  // Ensure images directory exists
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    console.log(`📁 Created images container folder at: ${imagesDir}`);
    console.log("👉 Place your product image files inside this folder.\n");
  }

  console.log("📖 Parsing CSV spreadsheet rows...");
  const fileContent = fs.readFileSync(csvPath, "utf-8");
  const lines = fileContent.split(/\r?\n/).filter(line => line.trim().length > 0);
  
  if (lines.length <= 1) {
    console.log("⚠️ The spreadsheet template has no product rows to import.");
    return;
  }

  const headers = parseCSVLine(lines[0]);
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < headers.length) continue; // skip corrupted lines

    const productName = values[0];
    const description = values[1] || "";
    const categoryName = values[2];
    const g = (values[3] || "").trim().toUpperCase();
    const gender = ["GIRLS", "FEMALE", "WOMEN", "WOMAN", "LADY", "LADIES"].includes(g) ? "GIRLS" :
                   ["BOYS", "MALE", "MEN", "MAN", "GENTLEMEN"].includes(g) ? "BOYS" : "BOTH";
    const basePrice = parseFloat(values[4]) || 0;
    const costPrice = values[5] ? parseFloat(values[5]) : null;
    const tax = values[6] ? parseFloat(values[6]) : null;
    const imageFilename = values[7] || "";
    const sku = values[8];
    const barcode = values[9] || null;
    const size = values[10] || null;
    const color = values[11] || null;
    const variantPrice = values[12] ? parseFloat(values[12]) : null;
    const stockQuantity = parseInt(values[13]) || 0;
    const lowStockThreshold = parseInt(values[14]) || 5;

    if (!productName || !sku || !categoryName) {
      console.warn(`⚠️ Line ${i + 1} skipped: Missing Product Name, SKU, or Category Name.`);
      continue;
    }

    rows.push({
      productName,
      description,
      categoryName,
      gender,
      basePrice,
      costPrice,
      tax,
      imageFilename,
      sku,
      barcode,
      size,
      color,
      variantPrice,
      stockQuantity,
      lowStockThreshold
    });
  }

  console.log(`✅ Loaded ${rows.length} variants across the catalog.\n`);

  // Group variants by product name
  const productsMap = new Map<string, CSVRow[]>();
  for (const row of rows) {
    if (!productsMap.has(row.productName)) {
      productsMap.set(row.productName, []);
    }
    productsMap.get(row.productName)!.push(row);
  }

  console.log(`📦 Identified ${productsMap.size} unique products. Beginning import sequence...\n`);

  let successCount = 0;
  let failCount = 0;

  for (const [name, variantsList] of productsMap.entries()) {
    const firstRow = variantsList[0];
    console.log(`--------------------------------------------------`);
    console.log(`🚀 IMPORTING: "${name}"`);
    console.log(`   └─ Category: ${firstRow.categoryName} | Gender: ${firstRow.gender}`);
    console.log(`   └─ Variants detected: ${variantsList.length}`);

    try {
      // 1. Get or Create Category
      let category = await prisma.category.findUnique({
        where: { name: firstRow.categoryName }
      });

      if (!category) {
        console.log(`   📁 Category "${firstRow.categoryName}" not found. Creating it...`);
        category = await prisma.category.create({
          data: {
            name: firstRow.categoryName,
            description: `Fashion items under the ${firstRow.categoryName} collection.`
          }
        });
      }

      // 2. Handle Cloudinary Image Upload
      let imageUrls: string[] = [];
      if (firstRow.imageFilename) {
        const localImagePath = path.join(imagesDir, firstRow.imageFilename);
        
        if (fs.existsSync(localImagePath)) {
          console.log(`   📤 Uploading media "${firstRow.imageFilename}" to Cloudinary...`);
          const uploadResult = await cloudinary.uploader.upload(localImagePath, {
            folder: "nextgenfashion/products",
            resource_type: "auto",
          });
          imageUrls.push(uploadResult.secure_url);
          console.log(`   ✅ Cloudinary link generated: ${uploadResult.secure_url}`);
        } else {
          console.warn(`   ⚠️ Warning: Image file not found at: ${localImagePath}. Using placeholder.`);
          imageUrls.push("https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600");
        }
      } else {
        imageUrls.push("https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600");
      }

      // 3. Database Atomicity (Connect variants and stock quantities)
      await prisma.$transaction(async (tx) => {
        // Upsert Product record
        let product = await tx.product.findFirst({
          where: { name: name }
        });

        if (product) {
          console.log(`   🔄 Product already exists. Updating base characteristics...`);
          product = await tx.product.update({
            where: { id: product.id },
            data: {
              description: firstRow.description || product.description,
              basePrice: firstRow.basePrice,
              costPrice: firstRow.costPrice,
              tax: firstRow.tax,
              images: imageUrls,
              targetGender: firstRow.gender,
              categoryId: category.id
            }
          });
        } else {
          console.log(`   ✨ Creating new Product record...`);
          product = await tx.product.create({
            data: {
              name: name,
              description: firstRow.description,
              basePrice: firstRow.basePrice,
              costPrice: firstRow.costPrice,
              tax: firstRow.tax,
              images: imageUrls,
              targetGender: firstRow.gender,
              categoryId: category.id
            }
          });
        }

        // Process Variants
        for (const variantData of variantsList) {
          const variantSku = (variantData.sku || `NGN-${name.slice(0, 3).toUpperCase()}-${variantData.size || "OS"}-${variantData.color || "DF"}-${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase();

          let variant = await tx.productVariant.findUnique({
            where: { sku: variantSku }
          });

          if (variant) {
            console.log(`   🔄 Variant with SKU "${variantSku}" already exists. Syncing specs...`);
            variant = await tx.productVariant.update({
              where: { sku: variantSku },
              data: {
                barcode: variantData.barcode,
                size: variantData.size || "OS",
                color: variantData.color || "Default",
                price: variantData.variantPrice || firstRow.basePrice
              }
            });
          } else {
            console.log(`   🎨 Adding new variant: SKU "${variantSku}" [Size: ${variantData.size || "OS"}, Color: ${variantData.color || "Default"}]`);
            variant = await tx.productVariant.create({
              data: {
                productId: product.id,
                sku: variantSku,
                barcode: variantData.barcode,
                size: variantData.size || "OS",
                color: variantData.color || "Default",
                price: variantData.variantPrice || firstRow.basePrice
              }
            });
          }

          // Process Inventory
          let inventory = await tx.inventory.findUnique({
            where: { variantId: variant.id }
          });

          if (inventory) {
            console.log(`   📦 Updating inventory for SKU "${variantData.sku}": +${variantData.stockQuantity} items...`);
            await tx.inventory.update({
              where: { variantId: variant.id },
              data: {
                quantity: variantData.stockQuantity,
                lowStockThreshold: variantData.lowStockThreshold
              }
            });
          } else {
            console.log(`   📦 Initializing inventory for SKU "${variantData.sku}": ${variantData.stockQuantity} items...`);
            await tx.inventory.create({
              data: {
                variantId: variant.id,
                quantity: variantData.stockQuantity,
                lowStockThreshold: variantData.lowStockThreshold
              }
            });
          }
        }
      });

      console.log(`🎉 SUCCESS: Fully mapped "${name}" and all its inventory!`);
      successCount++;
    } catch (err: any) {
      console.error(`❌ FAILED: Error importing product "${name}":`, err.message || err);
      failCount++;
    }
  }

  console.log(`\n=========================================`);
  console.log(`🏆 BULK IMPORT SUMMARY`);
  console.log(`   ├─ Successful Products: ${successCount}`);
  console.log(`   ├─ Failed Products:     ${failCount}`);
  console.log(`=========================================\n`);
}

// run()
//   .catch(err => {
//     console.error("Fatal Error running seed importer:", err);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//     await pool.end();
//   });
