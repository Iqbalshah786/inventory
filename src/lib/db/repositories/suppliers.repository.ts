import { query, execute } from "@/lib/db/connection";
import type { Supplier, SupplierWithBalance } from "@/types";
import { AED_PER_USD } from "@/lib/utils/currency";

export async function findAll(): Promise<Supplier[]> {
  return query<Supplier>("SELECT id, name FROM suppliers ORDER BY name");
}

export async function findAllWithBalance(): Promise<SupplierWithBalance[]> {
  const sql = `
    SELECT
      s.id,
      s.name,
      COALESCE(
        (SELECT SUM(pl.total_usd_amount * ${AED_PER_USD} + COALESCE(pl.local_cost_aed,0) + COALESCE(pl.fedex_cost_usd,0) * ${AED_PER_USD})
         FROM purchase_lots pl WHERE pl.supplier_id = s.id)
        -
        (SELECT COALESCE(SUM(lt.credit_aed),0) FROM ledger_transactions lt
          JOIN ledger_accounts la ON la.id = lt.account_id
          WHERE la.account_type = 'supplier'
            AND la.account_name = s.name),
        0
      ) AS balance_aed,
      COALESCE(
        (SELECT SUM(pl.total_usd_amount * ${AED_PER_USD} + COALESCE(pl.local_cost_aed,0) + COALESCE(pl.fedex_cost_usd,0) * ${AED_PER_USD})
         FROM purchase_lots pl WHERE pl.supplier_id = s.id)
        -
        (SELECT COALESCE(SUM(lt.credit_aed),0) FROM ledger_transactions lt
          JOIN ledger_accounts la ON la.id = lt.account_id
          WHERE la.account_type = 'supplier'
            AND la.account_name = s.name),
        0
      ) / ${AED_PER_USD} AS balance_usd
    FROM suppliers s
    ORDER BY s.name
  `;
  return query<SupplierWithBalance>(sql);
}

export async function create(name: string): Promise<number> {
  const result = await execute(
    "INSERT INTO suppliers (name) VALUES ($1) RETURNING id",
    [name],
  );
  return (result.rows[0] as { id: number }).id;
}

export async function findById(id: number): Promise<Supplier | null> {
  const rows = await query<Supplier>(
    "SELECT id, name FROM suppliers WHERE id = $1",
    [id],
  );
  return rows[0] ?? null;
}

export interface SupplierPurchaseHistoryRow {
  lot_id: number;
  purchase_date: string;
  model_name: string;
  quantity: number;
  unit_price_usd: number;
  line_total_usd: number;
  fedex_cost_usd: number;
  local_cost_aed: number;
}

export async function findPurchaseHistory(
  supplierId: number,
): Promise<SupplierPurchaseHistoryRow[]> {
  return query<SupplierPurchaseHistoryRow>(
    `SELECT
       pl.id AS lot_id,
       pl.purchase_date::text AS purchase_date,
       m.model_name,
       pli.quantity,
       pli.unit_price_usd,
       (pli.quantity * pli.unit_price_usd) AS line_total_usd,
       COALESCE(pl.fedex_cost_usd, 0) AS fedex_cost_usd,
       COALESCE(pl.local_cost_aed, 0) AS local_cost_aed
     FROM purchase_lots pl
     JOIN purchase_lot_items pli ON pli.lot_id = pl.id
     JOIN mobile_models m ON m.id = pli.model_id
     WHERE pl.supplier_id = $1
     ORDER BY pl.purchase_date DESC, pl.id DESC`,
    [supplierId],
  );
}
