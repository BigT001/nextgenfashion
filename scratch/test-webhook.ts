

async function test() {
  console.log("⚡ Triggering mock real-time POS product upload webhook event...");
  
  const payload = {
    item_id: "9999",
    name: "NextGen Webhook Jacket",
    description: "Ultra premium water-resistant lightweight dynamic techwear shell",
    category: "Techwear",
    unit_price: "85000",
    cost_price: "50000",
    item_number: "BARCODE-TECH-9999",
    size: "XL",
    locations: {
      "1": { quantity: "15" },
      "2": { quantity: "10" }
    }
  };

  const response = await fetch("http://localhost:3000/api/webhooks/pos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-pos-webhook-secret": "pos-webhook-secret-key"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  console.log("==========================================");
  console.log("📥 WEBHOOK RESPONSE:");
  console.log(JSON.stringify(data, null, 2));
  console.log("==========================================");
}

test().catch(console.error);
