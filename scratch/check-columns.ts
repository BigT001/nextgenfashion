import "dotenv/config";
import { Client } from "pg";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function checkColumns() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Product'
    `);
    console.log("📊 Product Table Columns:");
    console.table(res.rows);
    
    const warehouseRes = await client.query(`
      SELECT table_name FROM information_schema.tables WHERE table_name = 'Warehouse'
    `);
    console.log("📊 Warehouse Table exists:", warehouseRes.rows.length > 0);

  } catch (err) {
    console.error("❌ Error checking columns:", err);
  } finally {
    await client.end();
  }
}

checkColumns();
