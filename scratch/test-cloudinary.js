const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dzkcu4tqf',
  api_key: '344985991637156',
  api_secret: 'RpWQ_Cc8gsCkdLH5mgCU6Ct7XqI',
  secure: true
});

async function main() {
  console.log("Listing all Cloudinary resources in the account...");
  try {
    let nextCursor = undefined;
    let allResources = [];
    do {
      const result = await cloudinary.api.resources({
        type: "upload",
        resource_type: "image",
        max_results: 100,
        next_cursor: nextCursor
      });
      allResources = allResources.concat(result.resources);
      nextCursor = result.next_cursor;
    } while (nextCursor);

    console.log(`Found ${allResources.length} total resources in the account:`);
    for (const res of allResources) {
      console.log(`- ${res.public_id} (${res.secure_url})`);
    }
  } catch (err) {
    console.error("Error listing resources:", err);
  }
}

main();
