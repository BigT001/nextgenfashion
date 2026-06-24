import { prisma } from "../src/services/prisma.service";
import { DeliveryQueries } from "../src/modules/delivery/queries/delivery.queries";

async function runSimulation() {
  console.log("=========================================");
  console.log("🚚 SPEEDAF LOGISTICS LIFECYCLE SIMULATOR");
  console.log("=========================================\n");

  // 1. Find a sale order that has a waybill number to simulate
  const sale = await prisma.sale.findFirst({
    where: {
      waybillNumber: { not: null },
    },
    orderBy: { createdAt: "desc" },
    include: { Customer: true }
  });

  if (!sale || !sale.waybillNumber) {
    console.error("❌ No dispatched orders found in the database with a waybill number.");
    console.log("Please dispatch an order from the Logistics Dashboard first!");
    process.exit(1);
  }

  const waybill = sale.waybillNumber;
  console.log(`🎯 Target Order: ${sale.orderNumber}`);
  console.log(`📦 Waybill Number: ${waybill}`);
  console.log(`👤 Customer: ${sale.Customer?.name || "Guest"}\n`);

  // Milestones simulation list
  const milestones = [
    {
      action: "PICKUP",
      status: "Shipment Picked Up",
      location: "Lagos Warehouse Hub",
      description: "Package collected by Speedaf courier from NextGen Fashion."
    },
    {
      action: "SORTING",
      status: "Arrived at Sorting Hub",
      location: "Lagos Oshodi Main Hub",
      description: "Package received at the local sorting facility and is being processed."
    },
    {
      action: "DEPARTURE",
      status: "Departed Oshodi Hub (In Transit)",
      location: "Lagos Oshodi Main Hub",
      description: "Package dispatched from sorting facility, en route to destination."
    },
    {
      action: "ARRIVAL",
      status: "Arrived at Destination Hub",
      location: `${sale.deliveryCityName || "Akamkpa"} Delivery Station`,
      description: "Package arrived at the local delivery center near the buyer."
    },
    {
      action: "OUT_FOR_DELIVERY",
      status: "Out for Delivery",
      location: `${sale.deliveryCityName || "Akamkpa"} Station`,
      description: "Package assigned to courier for final door delivery."
    },
    {
      action: "DELIVERED",
      status: "Delivered & Signed",
      location: sale.Customer?.address || "Customer Address",
      description: "Shipment delivered successfully. Thank you for shopping with NextGen Fashion!"
    }
  ];

  const webhookUrl = "http://localhost:3000/api/webhooks/speedaf";

  for (let i = 0; i < milestones.length; i++) {
    const milestone = milestones[i];
    console.log(`\n🔄 [Step ${i + 1}/${milestones.length}] Simulating: ${milestone.status}...`);

    const timestamp = new Date().toISOString();
    
    // Create the event payload matching both Admin and Storefront formats
    const eventPayload = {
      mailNo: waybill,
      waybillCode: waybill,
      action: milestone.action,
      actionName: milestone.status,
      msgEng: milestone.description,
      facilityName: milestone.location,
      createTime: timestamp,
      
      // Storefront timelines
      scanTime: timestamp,
      scanDesc: milestone.status,
      location: milestone.location
    };

    let simulatedViaWebhook = false;

    try {
      // Try simulating via Webhook HTTP call first
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(eventPayload)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Webhook HTTP simulation success:`, JSON.stringify(result));
        simulatedViaWebhook = true;
      } else {
        console.warn(`⚠️ Webhook HTTP simulation returned status ${response.status} (likely port conflict or wrong app running).`);
      }
    } catch (err: any) {
      console.warn(`⚠️ Webhook HTTP connection skipped (Is the server listening?).`);
    }

    // Fallback: Direct Database Update
    if (!simulatedViaWebhook) {
      console.log(`💾 Falling back to Direct Database Update for milestone: ${milestone.status}`);
      try {
        await DeliveryQueries.updateSaleDeliveryStatus(waybill, milestone.action, eventPayload);
        console.log(`✅ Database updated directly.`);
      } catch (dbErr: any) {
        console.error(`❌ Failed to update database directly:`, dbErr.message);
        break;
      }
    }

    // Wait 2.5 seconds before next milestone
    if (i < milestones.length - 1) {
      console.log("⏱️ Waiting 3 seconds before next milestone...");
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  console.log("\n🏁 Simulation complete! Refresh the storefront order page or admin dashboard to inspect the status changes.");
}

runSimulation().catch(console.error).finally(() => process.exit(0));
