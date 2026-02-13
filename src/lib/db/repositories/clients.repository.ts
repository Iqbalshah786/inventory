import { query, execute } from "@/lib/db/connection";
import type { Client, ClientWithBalance } from "@/types";

export async function findAll(): Promise<Client[]> {
  return query<Client>(
    "SELECT id, name, client_type FROM clients ORDER BY name",
  );
}

export async function findAllWithBalance(): Promise<ClientWithBalance[]> {
  const sql = `
    SELECT
      c.id,
      c.name,
      c.client_type,
      COALESCE(
        (SELECT SUM(s.total_amount_aed) FROM sales s WHERE s.client_id = c.id)
        -
        (SELECT COALESCE(SUM(lt.credit_aed),0) FROM ledger_transactions lt
          JOIN ledger_accounts la ON la.id = lt.account_id
          WHERE la.account_type = 'client'
            AND la.account_name = c.name),
        0
      ) AS balance
    FROM clients c
    ORDER BY c.name
  `;
  return query<ClientWithBalance>(sql);
}

export async function create(
  name: string,
  client_type: string,
): Promise<number> {
  const result = await execute(
    "INSERT INTO clients (name, client_type) VALUES ($1, $2) RETURNING id",
    [name, client_type],
  );
  return (result.rows[0] as { id: number }).id;
}

export async function findById(id: number): Promise<Client | null> {
  const rows = await query<Client>(
    "SELECT id, name, client_type FROM clients WHERE id = $1",
    [id],
  );
  return rows[0] ?? null;
}
