const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: "postgresql://postgres.tpbfihldxnpgppdhfxon:Masterc0de1992%40@aws-1-eu-central-2.pooler.supabase.com:5432/postgres",
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log("Inspecting columns of table Product...");
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Product';
    `);
    console.log("Columns:");
    for (const row of res.rows) {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    }
  } catch (err) {
    console.error("Error inspecting:", err);
  } finally {
    await pool.end();
  }
}

main();
