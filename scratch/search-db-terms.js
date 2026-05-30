const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: "postgresql://postgres.tpbfihldxnpgppdhfxon:Masterc0de1992%40@aws-1-eu-central-2.pooler.supabase.com:5432/postgres",
  ssl: { rejectUnauthorized: false }
});

const searchTerms = ['6022', '6152', '6930', '8224', '2741', '7156', '7763', '3540'];

async function main() {
  console.log("Searching database for Cloudinary codes...");
  try {
    // We will query information_schema to find all text columns in our public tables
    const columnsRes = await pool.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND data_type IN ('text', 'character varying');
    `);
    
    console.log(`Searching through ${columnsRes.rows.length} text columns...`);
    
    for (const row of columnsRes.rows) {
      const { table_name, column_name } = row;
      for (const term of searchTerms) {
        const checkRes = await pool.query(`
          SELECT COUNT(*)::int as count 
          FROM "${table_name}" 
          WHERE "${column_name}"::text ILIKE $1
        `, [`%${term}%`]);
        
        if (checkRes.rows[0].count > 0) {
          console.log(`MATCH found: Table "${table_name}", Column "${column_name}" contains term "${term}"!`);
          const dataRes = await pool.query(`
            SELECT * FROM "${table_name}" 
            WHERE "${column_name}"::text ILIKE $1
          `, [`%${term}%`]);
          console.log("Data:", dataRes.rows);
        }
      }
    }
    
  } catch (err) {
    console.error("Error searching database:", err);
  } finally {
    await pool.end();
  }
}

main();
