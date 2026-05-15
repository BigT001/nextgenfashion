import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function listImages() {
  const result = await cloudinary.search
    .expression("folder:nextgenfashion/products")
    .max_results(20)
    .execute();

  console.log("📦 Total images in nextgenfashion/products:", result.total_count);
  result.resources.forEach((r: any) => {
    console.log(`  - ${r.public_id} → ${r.secure_url}`);
  });

  // Also check root folder
  const root = await cloudinary.search
    .expression("resource_type:image")
    .max_results(30)
    .execute();

  console.log("\n🌍 All images:");
  root.resources.forEach((r: any) => {
    console.log(`  [${r.folder || "root"}] ${r.secure_url}`);
  });
}

listImages().catch(console.error);
