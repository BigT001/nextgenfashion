import { SpeedafService } from "../src/modules/delivery/services/speedaf.service";

async function main() {
  try {
    console.log("Testing waybill creation...");
    const result = await SpeedafService.createWaybill({
      orderNumber: "TEST-NG-" + Date.now(),
      receiver: {
        name: "Samuel Stanley Tester",
        phone: "09087499849",
        provinceName: "Cross River",
        cityName: "Akamkpa",
        districtName: "Awi",
        streetAddress: "7 Alahaji Noah streets, igando, Lagos, Akamkpa",
      },
      items: [
        {
          sku: "TEST-SKU-001",
          name: "Test Premium Shirt",
          quantity: 1,
          price: 25000,
          weight: 0.5,
        }
      ],
      weight: 0.5,
    });
    console.log("Waybill Result:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Error during waybill creation:", err);
  }
}

main();
