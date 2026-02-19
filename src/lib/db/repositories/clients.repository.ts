import { query, execute } from "@/lib/db/connection";
import type { Client, ClientWithBalance } from "@/types";
import { AED_PER_USD } from "@/lib/utils/currency";

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
        (SELECT COALESCE(SUM(lt.debit_aed),0) FROM ledger_transactions lt
          JOIN ledger_accounts la ON la.id = lt.account_id
          WHERE la.account_type = 'client'
            AND la.account_name = c.name),
        0
      ) AS balance,
      COALESCE(
        (SELECT SUM(s.total_amount_aed) FROM sales s WHERE s.client_id = c.id)
        -
        (SELECT COALESCE(SUM(lt.debit_aed),0) FROM ledger_transactions lt
          JOIN ledger_accounts la ON la.id = lt.account_id
          WHERE la.account_type = 'client'
            AND la.account_name = c.name),
        0
      ) / ${AED_PER_USD} AS balance_usd
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

export interface ClientPurchaseHistoryRow {
  sale_id: number;
  sale_date: string;
  model_name: string;
  quantity: number;
  selling_price_aed: number;
  line_total_aed: number;
}

export async function findPurchaseHistory(
  clientId: number,
): Promise<ClientPurchaseHistoryRow[]> {
  return query<ClientPurchaseHistoryRow>(
    `SELECT
       s.id AS sale_id,
       s.sale_date::text AS sale_date,
       m.model_name,
       si.quantity,
       si.selling_price_aed,
       (si.quantity * si.selling_price_aed) AS line_total_aed
     FROM sales s
     JOIN sale_items si ON si.sale_id = s.id
     JOIN mobile_models m ON m.id = si.model_id
     WHERE s.client_id = $1
     ORDER BY s.sale_date DESC, s.id DESC`,
    [clientId],
  );
}
