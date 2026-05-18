import * as dotenv from "dotenv";
dotenv.config();
import { Pool } from "pg";

async function main() {
  const directUrl = "postgresql://postgres.xiokmmndthqbdcjhsuun:Masterc0de%40nextgen1992@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";
  const pool = new Pool({
    connectionString: directUrl,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    const res = await pool.query("SELECT * FROM \"Category\"");
    console.log("SUCCESS! Categories count:", res.rows.length);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error("FAIL:", err);
  } finally {
    await pool.end();
  }
}

main();
