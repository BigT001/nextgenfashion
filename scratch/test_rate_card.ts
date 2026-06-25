import { SpeedafService } from "../src/modules/delivery/services/speedaf.service";

interface TestCase {
  state: string;
  weight: number;
  expectedZone: number;
  expectedFee: number;
}

const testCases: TestCase[] = [
  // Zone 1: Lagos
  { state: "Lagos", weight: 0.5, expectedZone: 1, expectedFee: 2494.4 },
  { state: "lagos state", weight: 1.0, expectedZone: 1, expectedFee: 2992.8 },
  { state: "LAGOS", weight: 1.5, expectedZone: 1, expectedFee: 3242.4 },
  { state: "Lagos", weight: 2.5, expectedZone: 1, expectedFee: 3740.8 },
  { state: "Lagos", weight: 5.0, expectedZone: 1, expectedFee: 5495.2 },
  { state: "Lagos", weight: 10.0, expectedZone: 1, expectedFee: 8987.2 },

  // Zone 2: Southwest & Kwara
  { state: "Ogun", weight: 0.5, expectedZone: 2, expectedFee: 4092.3 },
  { state: "Oyo", weight: 1.0, expectedZone: 2, expectedFee: 4383.0 },
  { state: "Osun", weight: 1.5, expectedZone: 2, expectedFee: 4963.5 },
  { state: "Ondo", weight: 2.5, expectedZone: 2, expectedFee: 5553.9 },
  { state: "Ekiti", weight: 5.0, expectedZone: 2, expectedFee: 7304.4 },
  { state: "Kwara", weight: 10.0, expectedZone: 2, expectedFee: 11387.7 },

  // Zone 3: Southeast, South South, Abuja
  { state: "Abia", weight: 0.5, expectedZone: 3, expectedFee: 5476.5 },
  { state: "Anambra", weight: 1.0, expectedZone: 3, expectedFee: 5776.2 },
  { state: "Enugu", weight: 1.5, expectedZone: 3, expectedFee: 6085.8 },
  { state: "Imo", weight: 2.5, expectedZone: 3, expectedFee: 6994.8 },
  { state: "Rivers", weight: 5.0, expectedZone: 3, expectedFee: 8823.6 },
  { state: "Fct", weight: 10.0, expectedZone: 3, expectedFee: 14125.5 },
  { state: "Federal Capital Territory", weight: 0.5, expectedZone: 3, expectedFee: 5476.5 },
  { state: "Abuja", weight: 1.0, expectedZone: 3, expectedFee: 5776.2 },

  // Zone 4: Northern Cities
  { state: "Kano", weight: 0.5, expectedZone: 4, expectedFee: 6695.1 },
  { state: "Kaduna", weight: 1.0, expectedZone: 4, expectedFee: 6994.8 },
  { state: "Plateau", weight: 1.5, expectedZone: 4, expectedFee: 7304.4 },
  { state: "Kogi", weight: 2.5, expectedZone: 4, expectedFee: 8214.3 },
  { state: "Niger", weight: 5.0, expectedZone: 4, expectedFee: 10043.1 },
  { state: "Sokoto", weight: 10.0, expectedZone: 4, expectedFee: 15441.3 },

  // Splitting weight logic (> 10kg)
  // 12.5 kg in Lagos (Zone 1) = 10.0kg (8987.2) + 2.5kg (3740.8) = 12728.0
  { state: "Lagos", weight: 12.5, expectedZone: 1, expectedFee: 12728.0 },
  // 11.0 kg in Oyo (Zone 2) = 10.0kg (11387.7) + 1.0kg (4383.0) = 15770.7
  { state: "Oyo", weight: 11.0, expectedZone: 2, expectedFee: 15770.7 },
  // 22.0 kg in Kano (Zone 4) = 10.0kg (15441.3) + 10.0kg (15441.3) + 2.0kg (7605.0) = 38487.6
  { state: "Kano", weight: 22.0, expectedZone: 4, expectedFee: 38487.6 }
];

async function runTests() {
  console.log("=== STARTING SPEEDAF RATE CARD INTEGRATION TESTS ===");
  let failures = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const resolvedZone = SpeedafService.getZoneForProvince(tc.state);
    const calculatedFee = SpeedafService.calculateMockTariff(tc.state, tc.weight);
    
    const zoneOk = resolvedZone === tc.expectedZone;
    const feeDiff = Math.abs(calculatedFee - tc.expectedFee);
    // Float comparison tolerance
    const feeOk = feeDiff < 0.01;

    if (zoneOk && feeOk) {
      console.log(`[PASS] Case #${i + 1}: ${tc.state} | ${tc.weight}kg -> Zone ${resolvedZone}, Fee: ${calculatedFee} NGN`);
    } else {
      failures++;
      console.error(`[FAIL] Case #${i + 1}: ${tc.state} | ${tc.weight}kg`);
      if (!zoneOk) {
        console.error(`  Expected Zone: ${tc.expectedZone}, Got: ${resolvedZone}`);
      }
      if (!feeOk) {
        console.error(`  Expected Fee: ${tc.expectedFee} NGN, Got: ${calculatedFee} NGN (Diff: ${feeDiff})`);
      }
    }
  }

  console.log("====================================================");
  if (failures === 0) {
    console.log(`ALL ${testCases.length} TESTS PASSED SUCCESSFULLY! 🎉`);
    process.exit(0);
  } else {
    console.error(`TESTS FAILED: ${failures} out of ${testCases.length} cases failed.`);
    process.exit(1);
  }
}

runTests();
