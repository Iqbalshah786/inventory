/**
 * Seed script: creates admin user with username "admin" and password "admin123"
 * Also ensures the inventory table has a unique constraint on model_id
 *
 * Usage: npx tsx scripts/seed-admin.ts
 */

import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import argon2 from "argon2";
import * as dotenv from "dotenv";
import path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

neonConfig.webSocketConstructor = ws;

const host = process.env.DB_HOST ?? "localhost";
const port = process.env.DB_PORT ?? "5432";
const user = process.env.DB_USER ?? "postgres";
const password = process.env.DB_PASSWORD ?? "";
const database = process.env.DB_NAME ?? "inventory_db";

const connectionString = `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}?sslmode=require`;

async function main() {
  const pool = new Pool({ connectionString });

  try {
    // Ensure unique constraint on inventory.model_id for ON CONFLICT
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'inventory_model_id_key'
        ) THEN
          ALTER TABLE inventory ADD CONSTRAINT inventory_model_id_key UNIQUE (model_id);
        END IF;
      END
      $$;
    `);
    console.log("✓ Unique constraint on inventory.model_id ensured");

    // Hash password
    const hashedPassword = await argon2.hash("admin123");

    // Upsert admin user
    await pool.query(
      `INSERT INTO admin (username, password)
       VALUES ($1, $2)
       ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password`,
      ["admin", hashedPassword],
    );

    console.log("✓ Admin user created/updated:");
    console.log("  Username: admin");
    console.log("  Password: admin123");
  } catch (err) {
    console.error("Error seeding admin:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
