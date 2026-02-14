import { getClient } from "@/lib/db/connection";
import { query } from "@/lib/db/connection";
import { convertToAED } from "@/lib/utils/currency";
import type { StockFormInput } from "@/lib/validations";
import type { StockListRow } from "@/types";

export async function findAll(dateFilter?: string): Promise<StockListRow[]> {
  let sql = `
    SELECT
      pl.id,
      pl.purchase_date,
      m.model_name,
      pli.quantity,
      pli.unit_price_usd AS buying_price,
      COALESCE(pl.fedex_cost_usd, 0) AS fedex_cost,
      COALESCE(pl.local_cost_aed, 0) AS local_expense,
      (pli.quantity * pli.unit_price_usd) AS total_price
    FROM purchase_lot_items pli
    JOIN purchase_lots pl ON pl.id = pli.lot_id
    JOIN mobile_models m ON m.id = pli.model_id
  `;
  const params: unknown[] = [];

  if (dateFilter) {
    sql += " WHERE pl.purchase_date = $1";
    params.push(dateFilter);
  }

  sql += " ORDER BY pl.purchase_date DESC, pl.id DESC";

  return query<StockListRow>(sql, params);
}

export async function createStock(input: StockFormInput): Promise<number> {
  const client = await getClient();

  try {
    await client.query("BEGIN");

    const totalQty = input.items.reduce((s, i) => s + i.quantity, 0);
    const totalUsd = input.items.reduce(
      (s, i) => s + i.quantity * i.buyer_price_usd,
      0,
    );

    // 1. Insert purchase lot
    const lotRes = await client.query(
      `INSERT INTO purchase_lots
        (purchase_date, total_quantity, total_usd_amount, local_cost_aed, fedex_cost_usd)
       VALUES (CURRENT_DATE, $1, $2, $3, $4)
       RETURNING id`,
      [totalQty, totalUsd, input.local_expense_aed, input.fedex_cost_usd],
    );
    const lotId: number = lotRes.rows[0].id;

    // Extra costs: fedex is USD (convert to AED), local is already AED
    const fedexAed = convertToAED(input.fedex_cost_usd);
    const totalExtraAed = fedexAed + input.local_expense_aed;

    for (const item of input.items) {
      // 2. Insert lot items
      await client.query(
        `INSERT INTO purchase_lot_items (lot_id, model_id, quantity, unit_price_usd)
         VALUES ($1, $2, $3, $4)`,
        [lotId, item.model_id, item.quantity, item.buyer_price_usd],
      );

      // 3. Calculate per-item cost in AED
      //    Formula: (buying_price_usd * AED_RATE) + (fedex_usd * AED_RATE + local_aed) / total_qty_of_lot
      const overheadPerPiece = totalQty > 0 ? totalExtraAed / totalQty : 0;
      const costPerItemAed =
        convertToAED(item.buyer_price_usd) + overheadPerPiece;

      // 4. Upsert inventory (PostgreSQL ON CONFLICT)
      await client.query(
        `INSERT INTO inventory (model_id, quantity_remaining, cost_per_item_aed, avg_cost_aed, avg_cost_usd)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (model_id) DO UPDATE SET
           quantity_remaining = inventory.quantity_remaining + EXCLUDED.quantity_remaining,
           avg_cost_aed = (
             (inventory.avg_cost_aed * inventory.quantity_remaining + EXCLUDED.avg_cost_aed * EXCLUDED.quantity_remaining)
             / (inventory.quantity_remaining + EXCLUDED.quantity_remaining)
           ),
           avg_cost_usd = (
             (inventory.avg_cost_aed * inventory.quantity_remaining + EXCLUDED.avg_cost_aed * EXCLUDED.quantity_remaining)
             / (inventory.quantity_remaining + EXCLUDED.quantity_remaining)
           ) / $6,
           cost_per_item_aed = EXCLUDED.cost_per_item_aed`,
        [
          item.model_id,
          item.quantity,
          costPerItemAed,
          costPerItemAed,
          item.buyer_price_usd,
          convertToAED(1),
        ],
      );
    }

    // 5. Ledger: record purchase expense
    await client.query(
      `INSERT INTO ledger_accounts (account_name, account_type)
       SELECT 'Inventory', 'inventory'
       WHERE NOT EXISTS (
         SELECT 1 FROM ledger_accounts WHERE account_name = 'Inventory' AND account_type = 'inventory'
       )`,
    );

    const acctRes = await client.query(
      "SELECT id FROM ledger_accounts WHERE account_name = 'Inventory' AND account_type = 'inventory'",
    );
    const acctId: number = acctRes.rows[0].id;

    const totalAed = convertToAED(totalUsd) + totalExtraAed;

    await client.query(
      `INSERT INTO ledger_transactions
        (account_id, transaction_date, description, debit_aed, credit_aed, debit_usd, credit_usd, reference_type, reference_id)
       VALUES ($1, CURRENT_DATE, $2, $3, 0, $4, 0, 'purchase', $5)`,
      [acctId, `Stock purchase lot #${lotId}`, totalAed, totalUsd, lotId],
    );

    // 6. If amount_paid, record cash out
    if (input.amount_paid && input.amount_paid > 0) {
      await client.query(
        `INSERT INTO ledger_accounts (account_name, account_type)
         SELECT 'Cash', 'cash'
         WHERE NOT EXISTS (
           SELECT 1 FROM ledger_accounts WHERE account_name = 'Cash' AND account_type = 'cash'
         )`,
      );

      const cashRes = await client.query(
        "SELECT id FROM ledger_accounts WHERE account_name = 'Cash' AND account_type = 'cash'",
      );
      const cashAcctId: number = cashRes.rows[0].id;

      await client.query(
        `INSERT INTO ledger_transactions
          (account_id, transaction_date, description, debit_aed, credit_aed, reference_type, reference_id)
         VALUES ($1, CURRENT_DATE, $2, 0, $3, 'purchase', $4)`,
        [cashAcctId, `Payment for lot #${lotId}`, input.amount_paid, lotId],
      );
    }

    await client.query("COMMIT");
    return lotId;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
