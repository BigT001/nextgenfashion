import { SpeedafService } from "../src/modules/delivery/services/speedaf.service";

async function main() {
  try {
    const fee = await SpeedafService.calculateTariff({
      receiverProvinceCode: "NGR00023", // Lagos
      receiverCityCode: "NGC00359",
      receiverAreaCode: "NGA05061",
      weight: 1
    });
    console.log("Fee:", fee);
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
