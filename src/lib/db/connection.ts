import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Enable WebSocket for local / non-edge environments
neonConfig.webSocketConstructor = ws;

function buildConnectionString(): string {
  const host = process.env.DB_HOST ?? "localhost";
  const port = process.env.DB_PORT ?? "5432";
  const user = process.env.DB_USER ?? "postgres";
  const password = process.env.DB_PASSWORD ?? "";
  const database = process.env.DB_NAME ?? "inventory_db";

  return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}?sslmode=require`;
}

// Singleton pool – survives hot reloads in dev
const globalForDb = globalThis as unknown as { __dbPool?: Pool };

function getPool(): Pool {
  if (!globalForDb.__dbPool) {
    globalForDb.__dbPool = new Pool({
      connectionString: buildConnectionString(),
      max: 10,
    });
  }
  return globalForDb.__dbPool;
}

const pool = getPool();

/** Execute a parameterised query and return typed rows */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const result = await pool.query(sql, params);
  return result.rows as T[];
}

/** Execute a parameterised statement (INSERT / UPDATE / DELETE) and return rows */
export async function execute(
  sql: string,
  params?: unknown[],
): Promise<{ rowCount: number; rows: Record<string, unknown>[] }> {
  const result = await pool.query(sql, params);
  return { rowCount: result.rowCount ?? 0, rows: result.rows };
}

/** Get a client from the pool (for transactions) */
export async function getClient() {
  return pool.connect();
}

export default pool;
