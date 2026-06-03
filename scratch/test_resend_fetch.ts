import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const resend = new Resend(process.env.RESEND_API_KEY);

async function test() {
  const emailId = "7200c541-737e-41e2-a36f-87d8dc8b1e47";
  try {
    const response = await resend.emails.receiving.get(emailId);
    console.log("Response:", JSON.stringify(response, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
