import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import "dotenv/config";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({
  connectionString: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?sslmode=require`,
});

async function migrate() {
  console.log("Renaming fedex_cost_aed → fedex_cost_usd in purchase_lots…");

  await pool.query(`
    ALTER TABLE purchase_lots
    RENAME COLUMN fedex_cost_aed TO fedex_cost_usd
  `);

  console.log("Done.");
  await pool.end();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
